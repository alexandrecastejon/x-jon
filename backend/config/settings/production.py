"""Production settings — set DJANGO_SECRET_KEY, PostgreSQL vars, ALLOWED_HOSTS, CORS."""
import os

from .base import *  # noqa: F401,F403

_base_mw = list(MIDDLEWARE)  # noqa: F405
MIDDLEWARE = [
    _base_mw[0],
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *_base_mw[1:],
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

_aws_bucket = os.environ.get("AWS_STORAGE_BUCKET_NAME", "").strip()
if _aws_bucket:
    AWS_STORAGE_BUCKET_NAME = _aws_bucket
    AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "us-east-1").strip()
    if os.environ.get("AWS_ACCESS_KEY_ID"):
        AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
    if os.environ.get("AWS_SECRET_ACCESS_KEY"):
        AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    # URLs públicas (sem query string); o bucket precisa de política GetObject pública ou CloudFront.
    AWS_QUERYSTRING_AUTH = False
    AWS_DEFAULT_ACL = None
    _custom_domain = os.environ.get("AWS_S3_CUSTOM_DOMAIN", "").strip()
    if _custom_domain:
        AWS_S3_CUSTOM_DOMAIN = _custom_domain
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    }

DEBUG = False
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
    if h.strip()
]
# App Runner health-check usa IP interno do container
ALLOWED_HOSTS += ["127.0.0.1", "localhost"]

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "xjon"),
        "USER": os.environ.get("POSTGRES_USER", "xjon"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

_cors = os.environ.get("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]
CORS_ALLOW_ALL_ORIGINS = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
