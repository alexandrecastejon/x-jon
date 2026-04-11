from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import Follow

from .models import Post

User = get_user_model()


class FeedAndPostTests(APITestCase):
    def setUp(self):
        self.a = User.objects.create_user(
            username="alice", email="a@a.com", password="pass12345"
        )
        self.b = User.objects.create_user(
            username="bob", email="b@b.com", password="pass12345"
        )
        self.c = User.objects.create_user(
            username="carol", email="c@c.com", password="pass12345"
        )
        Follow.objects.create(follower=self.a, following=self.b)
        self.post_b = Post.objects.create(author=self.b, content="hello from bob")
        self.post_a = Post.objects.create(author=self.a, content="my own post")

    def _auth(self, user):
        t = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {t.access_token}")

    def test_feed_shows_followed_not_self(self):
        self._auth(self.a)
        r = self.client.get("/api/posts/feed/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in r.data["results"]]
        self.assertIn(self.post_b.id, ids)
        self.assertNotIn(self.post_a.id, ids)

    def test_feed_empty_without_follows(self):
        self._auth(self.c)
        r = self.client.get("/api/posts/feed/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["results"], [])

    def test_author_can_patch_post(self):
        self._auth(self.b)
        r = self.client.patch(
            f"/api/posts/{self.post_b.id}/",
            {"content": "edited"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["content"], "edited")

    def test_non_author_cannot_patch_post(self):
        self._auth(self.a)
        r = self.client.patch(
            f"/api/posts/{self.post_b.id}/",
            {"content": "hacked"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class LikeTests(APITestCase):
    def setUp(self):
        self.u = User.objects.create_user(
            username="u1", email="u1@u.com", password="pass12345"
        )
        self.p = Post.objects.create(author=self.u, content="x")

    def _auth(self, user):
        t = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {t.access_token}")

    def test_like_idempotent(self):
        self._auth(self.u)
        r1 = self.client.post(f"/api/posts/{self.p.id}/like/")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        r2 = self.client.post(f"/api/posts/{self.p.id}/like/")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(self.p.likes.count(), 1)
