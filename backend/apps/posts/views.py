from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.users.models import Follow

from .models import Like, Post
from .serializers import CommentSerializer, PostSerializer, PostUpdateSerializer
from .utils import annotate_post_queryset


class PostViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action == "feed":
            return [IsAuthenticated()]
        if self.action == "comments":
            if self.request.method == "GET":
                return [AllowAny()]
            return [IsAuthenticated()]
        if self.action == "like":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return PostUpdateSerializer
        return PostSerializer

    def get_queryset(self):
        qs = Post.objects.select_related("author", "author__profile")
        return annotate_post_queryset(qs, self.request.user)

    def list(self, request, *args, **kwargs):
        return Response([])

    def perform_update(self, serializer):
        if serializer.instance.author_id != self.request.user.id:
            raise PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author_id != self.request.user.id:
            raise PermissionDenied()
        instance.delete()

    @action(detail=False, methods=["get"], url_path="feed")
    def feed(self, request):
        following_ids = Follow.objects.filter(follower=request.user).values_list(
            "following_id", flat=True
        )
        qs = (
            Post.objects.filter(author_id__in=following_ids)
            .select_related("author", "author__profile")
            .order_by("-created_at")
        )
        qs = annotate_post_queryset(qs, request.user)
        page = self.paginate_queryset(qs)
        ser = PostSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        post = get_object_or_404(Post.objects.all(), pk=pk)
        if request.method == "GET":
            qs = post.comments.select_related("author", "author__profile").order_by(
                "created_at"
            )
            page = self.paginate_queryset(qs)
            ser = CommentSerializer(page, many=True, context={"request": request})
            if page is not None:
                return self.get_paginated_response(ser.data)
            return Response(ser.data)
        ser = CommentSerializer(
            data=request.data,
            context={"request": request, "post_id": post.id},
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "delete"], url_path="like")
    def like(self, request, pk=None):
        post = get_object_or_404(Post.objects.all(), pk=pk)
        if request.method == "POST":
            Like.objects.get_or_create(user=request.user, post=post)
            return Response({"detail": "Curtida registrada."}, status=status.HTTP_200_OK)
        Like.objects.filter(user=request.user, post=post).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
