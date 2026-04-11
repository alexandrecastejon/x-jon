from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    FollowersListView,
    FollowingListView,
    FollowToggleView,
    MeAvatarView,
    MeView,
    PasswordChangeView,
    RegisterView,
    UserDetailView,
    UserPostsListView,
    UserSearchListView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/avatar/", MeAvatarView.as_view(), name="users-me-avatar"),
    path("users/me/password/", PasswordChangeView.as_view(), name="users-me-password"),
    path("users/search/", UserSearchListView.as_view(), name="users-search"),
    path("users/<str:username>/", UserDetailView.as_view(), name="users-detail"),
    path("users/<str:username>/follow/", FollowToggleView.as_view(), name="users-follow"),
    path(
        "users/<str:username>/followers/",
        FollowersListView.as_view(),
        name="users-followers",
    ),
    path(
        "users/<str:username>/following/",
        FollowingListView.as_view(),
        name="users-following",
    ),
    path(
        "users/<str:username>/posts/",
        UserPostsListView.as_view(),
        name="users-posts",
    ),
]
