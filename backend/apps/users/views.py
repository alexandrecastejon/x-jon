from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow
from .serializers import (
    FollowUserMiniSerializer,
    MeSerializer,
    PasswordChangeSerializer,
    RegisterSerializer,
    UserPublicSerializer,
)

User = get_user_model()


def _explore_users_queryset(request_user):
    """Utilizadores exceto o atual, com contagens anotadas (perfil / busca / sugestões)."""
    return (
        User.objects.select_related("profile")
        .exclude(pk=request_user.pk)
        .annotate(
            annotated_followers_count=Count("followers_rel", distinct=True),
            annotated_following_count=Count("following_rel", distinct=True),
            annotated_posts_count=Count("posts", distinct=True),
        )
        .order_by("username")
    )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class MeAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        profile = request.user.profile
        file = request.FILES.get("avatar")
        if not file:
            return Response(
                {"detail": "Campo avatar é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profile.avatar = file
        profile.save()
        from .serializers import ProfileSerializer

        return Response(ProfileSerializer(profile, context={"request": request}).data)


class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"detail": "Senha alterada com sucesso."})


class UserSearchListView(generics.ListAPIView):
    """Autenticado: sem `q` na querystring, lista todos (exceto si); com `q`, filtra substring."""

    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        base = _explore_users_queryset(self.request.user)
        params = self.request.query_params
        if "q" not in params:
            return base
        raw = params.get("q", "")
        term = raw.strip()
        if not term:
            return base.none()
        return base.filter(
            Q(username__icontains=term)
            | Q(profile__display_name__icontains=term)
            | Q(profile__bio__icontains=term)
        )


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.select_related("profile").all()
    serializer_class = UserPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = "username"
    lookup_url_kwarg = "username"


class FollowToggleView(APIView):
    def post(self, request, username):
        target = get_object_or_404(User, username=username)
        if target.id == request.user.id:
            return Response(
                {"detail": "Não é possível seguir a si mesmo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target
        )
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response({"detail": "Você segue este usuário."}, status=code)

    def delete(self, request, username):
        target = get_object_or_404(User, username=username)
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowersListView(generics.ListAPIView):
    serializer_class = FollowUserMiniSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs["username"])
        ids = user.followers_rel.values_list("follower_id", flat=True)
        return User.objects.filter(id__in=ids).select_related("profile")


class FollowingListView(generics.ListAPIView):
    serializer_class = FollowUserMiniSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs["username"])
        ids = user.following_rel.values_list("following_id", flat=True)
        return User.objects.filter(id__in=ids).select_related("profile")


class UserPostsListView(generics.ListAPIView):
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        from apps.posts.serializers import PostSerializer

        return PostSerializer

    def get_queryset(self):
        from apps.posts.models import Post
        from apps.posts.utils import annotate_post_queryset

        user = get_object_or_404(User, username=self.kwargs["username"])
        qs = Post.objects.filter(author=user).select_related(
            "author", "author__profile"
        )
        return annotate_post_queryset(qs, self.request.user)
