from django.db.models import BooleanField, Count, Exists, OuterRef, Value

from .models import Like


def annotate_post_queryset(qs, user):
    if user.is_authenticated:
        likes_sub_user = Like.objects.filter(
            post_id=OuterRef("pk"),
            user_id=user.id,
        )
        return qs.annotate(
            likes_count=Count("likes", distinct=True),
            comments_count=Count("comments", distinct=True),
            is_liked=Exists(likes_sub_user),
        )
    return qs.annotate(
        likes_count=Count("likes", distinct=True),
        comments_count=Count("comments", distinct=True),
        is_liked=Value(False, output_field=BooleanField()),
    )
