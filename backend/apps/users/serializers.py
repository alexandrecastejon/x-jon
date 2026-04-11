from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .media_urls import avatar_absolute_url
from .models import Follow, Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(required=False, allow_blank=True, max_length=120)
    bio = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Profile
        fields = ("display_name", "bio", "avatar", "updated_at")
        read_only_fields = ("avatar", "updated_at")

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        abs_url = avatar_absolute_url(request, instance)
        if abs_url:
            ret["avatar"] = abs_url
        return ret


class ProfilePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("display_name", "bio", "avatar")

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        abs_url = avatar_absolute_url(request, instance)
        if abs_url:
            ret["avatar"] = abs_url
        return ret


class UserPublicSerializer(serializers.ModelSerializer):
    profile = ProfilePublicSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "profile",
            "followers_count",
            "following_count",
            "posts_count",
            "is_following",
        )
        read_only_fields = fields

    def get_followers_count(self, obj):
        v = getattr(obj, "annotated_followers_count", None)
        if v is not None:
            return v
        return obj.followers_rel.count()

    def get_following_count(self, obj):
        v = getattr(obj, "annotated_following_count", None)
        if v is not None:
            return v
        return obj.following_rel.count()

    def get_posts_count(self, obj):
        v = getattr(obj, "annotated_posts_count", None)
        if v is not None:
            return v
        return obj.posts.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if request.user.id == obj.id:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()


class MeSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ("id", "username", "email", "profile")
        read_only_fields = ("id", "username", "email")

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data is not None:
            profile = instance.profile
            for k, v in profile_data.items():
                setattr(profile, k, v)
            profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class FollowUserMiniSerializer(serializers.ModelSerializer):
    profile = ProfilePublicSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "profile")
