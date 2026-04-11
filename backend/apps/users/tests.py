from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSearchTests(APITestCase):
    def setUp(self):
        self.searcher = User.objects.create_user(
            username="searcher",
            email="s@s.com",
            password="pass12345",
        )
        self.searcher.profile.display_name = "Nome Searcher"
        self.searcher.profile.bio = "bio do searcher"
        self.searcher.profile.save()
        for i in range(22):
            User.objects.create_user(
                username=f"findtok{i:02d}",
                email=f"ft{i}@f.com",
                password="pass12345",
            )
        self.target = User.objects.create_user(
            username="uniquebob",
            email="b@b.com",
            password="pass12345",
        )
        self.target.profile.display_name = "Ana Maria"
        self.target.profile.bio = "gosta de café"
        self.target.profile.save()

    def _auth(self, user):
        t = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {t.access_token}")

    def test_search_requires_auth(self):
        r = self.client.get("/api/users/search/", {"q": "x"})
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_search_empty_q(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": ""})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["results"], [])

    def test_search_whitespace_q(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": "   "})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["results"], [])

    def test_match_username(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": "uniquebob"})
        usernames = [x["username"] for x in r.data["results"]]
        self.assertIn("uniquebob", usernames)

    def test_match_display_name(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": "Ana"})
        self.assertTrue(
            any(x["username"] == "uniquebob" for x in r.data["results"]),
        )

    def test_match_bio(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": "café"})
        self.assertTrue(
            any(x["username"] == "uniquebob" for x in r.data["results"]),
        )

    def test_self_never_in_results(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": "searcher"})
        usernames = [x["username"] for x in r.data["results"]]
        self.assertNotIn("searcher", usernames)

    def test_no_results(self):
        self._auth(self.searcher)
        r = self.client.get("/api/users/search/", {"q": "zzznomatch999"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["results"], [])

    def test_pagination(self):
        self._auth(self.searcher)
        r1 = self.client.get("/api/users/search/", {"q": "findtok"})
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r1.data["results"]), 20)
        self.assertIsNotNone(r1.data["next"])
        r2 = self.client.get("/api/users/search/", {"q": "findtok", "page": 2})
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r2.data["results"]), 2)


class UserSearchBrowseTests(APITestCase):
    """GET /api/users/search/ sem parâmetro `q` lista todos (modo explorar)."""

    def setUp(self):
        self.me = User.objects.create_user(
            username="meuser",
            email="m@m.com",
            password="pass12345",
        )
        self.other = User.objects.create_user(
            username="otheruser",
            email="o@o.com",
            password="pass12345",
        )

    def _auth(self, user):
        t = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {t.access_token}")

    def test_browse_requires_auth(self):
        r = self.client.get("/api/users/search/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_browse_without_q_lists_others_not_self(self):
        self._auth(self.me)
        r = self.client.get("/api/users/search/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        usernames = [x["username"] for x in r.data["results"]]
        self.assertIn("otheruser", usernames)
        self.assertNotIn("meuser", usernames)


class RegisterTests(APITestCase):
    def test_register_creates_user_and_profile(self):
        r = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "new@n.com",
                "password": "securepass123",
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        u = User.objects.get(username="newuser")
        self.assertTrue(hasattr(u, "profile"))
