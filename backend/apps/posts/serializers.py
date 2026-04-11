from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Comment, Like, Post

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "author", "content", "created_at")
        read_only_fields = ("id", "author", "created_at")

    def create(self, validated_data):
        post = Post.objects.get(pk=self.context["post_id"])
        validated_data["author"] = self.context["request"].user
        validated_data["post"] = post
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True, required=False)
    comments_count = serializers.IntegerField(read_only=True, required=False)
    is_liked = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = Post
        fields = (
            "id",
            "author",
            "content",
            "created_at",
            "updated_at",
            "likes_count",
            "comments_count",
            "is_liked",
        )
        read_only_fields = ("id", "author", "created_at", "updated_at")

    def validate_content(self, value):
        text = (value or "").strip()
        if not text:
            raise serializers.ValidationError("Conteúdo não pode ser vazio.")
        if len(text) > 280:
            raise serializers.ValidationError("Máximo de 280 caracteres.")
        return text

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ("content",)

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Conteúdo não pode ser vazio.")
        if len(value) > 280:
            raise serializers.ValidationError("Máximo de 280 caracteres.")
        return value.strip()
