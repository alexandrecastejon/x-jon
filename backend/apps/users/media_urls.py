"""URLs absolutas para ficheiros de perfil (filesystem local ou S3)."""


def avatar_absolute_url(request, profile):
    """
    Devolve URL absoluta do avatar.
    Com S3/django-storages, `FieldFile.url` já é https; com disco local, usa o host do request.
    """
    if not profile or not profile.avatar:
        return None
    try:
        url = profile.avatar.url
    except ValueError:
        return None
    if url.startswith(("http://", "https://")):
        return url
    if request:
        return request.build_absolute_uri(url)
    return url
