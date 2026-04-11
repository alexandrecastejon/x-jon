FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt

COPY . .

# collectstatic não precisa de banco nem de secret real
ENV DJANGO_SETTINGS_MODULE=config.settings.production \
    DJANGO_SECRET_KEY=build-placeholder \
    DJANGO_ALLOWED_HOSTS=localhost \
    POSTGRES_HOST=localhost \
    POSTGRES_PASSWORD=placeholder

RUN python manage.py collectstatic --noinput

RUN chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]
