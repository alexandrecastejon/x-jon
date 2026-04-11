from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import F, Q


class User(AbstractUser):
    email = models.EmailField("email address", unique=True)

    class Meta:
        db_table = "users_user"


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile({self.user.username})"


class Follow(models.Model):
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following_rel",
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followers_rel",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users_follow"
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"],
                name="users_follow_follower_following_uniq",
            ),
            models.CheckConstraint(
                condition=~Q(follower=F("following")),
                name="users_follow_no_self",
            ),
        ]
