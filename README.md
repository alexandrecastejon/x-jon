# x-jon

Clone funcional estilo Twitter: API **Django + Django REST Framework** e front **React (Vite)** em monorepo (`backend/` + `frontend/`).

| Recurso | URL |
|---------|-----|
| **Repositório** | [github.com/alexandrecastejon/x-jon](https://github.com/alexandrecastejon/x-jon) |
| **App em produção (AWS Amplify)** | [main.di9p4hmrarknh.amplifyapp.com](https://main.di9p4hmrarknh.amplifyapp.com) |

A API em produção é a URL **HTTPS** configurada na variável de ambiente **`VITE_API_URL`** no build do Amplify (deve coincidir com o backend Django na AWS e estar em `CORS_ALLOWED_ORIGINS` / `ALLOWED_HOSTS` no servidor).

---

## Estado do projeto (visão geral)

- **Autenticação:** JWT (`access` + `refresh`); registro e login.
- **Perfil:** nome exibido, bio, avatar (upload), troca de senha (campos opcionais no PATCH).
- **Social:** seguir / deixar de seguir, listas de seguidores e seguindo.
- **Posts:** CRUD completo (incluindo edição pelo autor), curtidas, comentários.
- **Feed:** apenas postagens de utilizadores que segues (sem os teus próprios posts na timeline); os teus posts aparecem no teu perfil.
- **Explorar:** lista de todos os outros perfis + busca com debounce (`/explorar`).
- **Testes de API:** `apps.users` e `apps.posts` (feed, edição, registo, busca, etc.).
- **Desenvolvimento local:** SQLite, `config.settings.development`, CORS aberto, media em `backend/media/`.
- **Produção:** PostgreSQL, `config.settings.production`, WhiteNoise para estáticos, Gunicorn; **CORS** restrito à origem do front (ex.: domínio Amplify). **Avatares:** com `AWS_STORAGE_BUCKET_NAME` definido, uploads vão para **S3** via `django-storages`; sem isso, ficam em disco local (adequado só se o servidor tiver volume persistente e rota `/media/` configurada).

---

## Regra do feed (requisito EBAC)

O endpoint `GET /api/posts/feed/` devolve **apenas** postagens de utilizadores que **segues**. **Não** inclui os teus próprios posts. Para ver o que publicaste, abre o **perfil** (`/u/<teu_username>`).

---

## Requisitos

- Python 3.11+ (testado com 3.14)
- Node.js 18+ e npm

---

## Desenvolvimento local

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS

pip install -r requirements/dev.txt
python manage.py migrate
python manage.py createsuperuser   # opcional — /admin/
python manage.py runserver
```

- API: `http://127.0.0.1:8000` — prefixo `/api/`.
- Settings: `DJANGO_SETTINGS_MODULE=config.settings.development` (definido em [`manage.py`](backend/manage.py)).

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- App: `http://127.0.0.1:5173`
- Em [`.env`](frontend/.env.example), `VITE_API_URL=http://127.0.0.1:8000` (sem barra final).

### Testes (backend)

```bash
cd backend
python manage.py test apps.users apps.posts
```

---

## Produção (AWS) — o que está comprovado

1. **Frontend:** hospedado no **AWS Amplify** a partir do repositório GitHub; build com `npm run build` na pasta `frontend/`. Variável **`VITE_API_URL`** no Amplify = URL pública **HTTPS** da API Django.
2. **Backend:** Django com Gunicorn, [`config.settings.production`](backend/config/settings/production.py), **PostgreSQL** (ex.: RDS), variáveis de ambiente conforme [`.env.example`](backend/.env.example) (comentários de produção).
3. **CORS:** `CORS_ALLOWED_ORIGINS` deve incluir a origem do Amplify, por exemplo `https://main.di9p4hmrarknh.amplifyapp.com` (sem barra final).
4. **ALLOWED_HOSTS:** host público da API (e do balanceador, se existir).
5. **Comandos típicos no servidor (após deploy):** `pip install -r requirements/prod.txt`, `python manage.py migrate`, `python manage.py collectstatic --noinput`.
6. **Avatares (S3):** ver secção [Avatares em produção (S3)](#avatares-em-produção-s3) — bucket, IAM e variáveis `AWS_*`.

```bash
# Exemplo local de comando Gunicorn (ajusta host/porta ao teu process manager)
export DJANGO_SETTINGS_MODULE=config.settings.production
# ... exportar SECRET_KEY, POSTGRES_*, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS ...
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Avatares em produção (S3)

Com `DEBUG=False`, o Django **não** serve `/media/` por defeito e o disco do contentor/instância costuma ser **efémero**. A configuração suportada no projeto é **S3** quando defines `AWS_STORAGE_BUCKET_NAME` (ver [`production.py`](backend/config/settings/production.py) e [`requirements/prod.txt`](backend/requirements/prod.txt)).

**Na AWS (manual):**

1. **Bucket S3** (ex.: `x-jon-media-prod`), mesma região que o backend quando possível.
2. **Política de bucket** para leitura pública dos objetos (avatares são URLs públicas sem query string). Ajusta o nome do bucket no ARN:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::x-jon-media-prod/*"
    }
  ]
}
```

Desativa **Block Public Access** só se aceitares objetos legíveis publicamente; alternativa mais restrita é bucket privado + URLs assinadas (exige alterar `AWS_QUERYSTRING_AUTH` e lógica de expiração).

3. **IAM** — utilizador ou **role** da instância (EC2/App Runner/ECS) com política mínima de escrita/leitura na API (a app só precisa de carregar; leitura pública é via política de bucket acima):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::x-jon-media-prod",
        "arn:aws:s3:::x-jon-media-prod/*"
      ]
    }
  ]
}
```

4. **Variáveis de ambiente** — ver [`.env.example`](backend/.env.example): `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`; com role IAM podes omitir `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. Opcional: `AWS_S3_CUSTOM_DOMAIN` para CloudFront.

A API devolve URLs absolutas: com S3, o path já vem como `https://...`; em desenvolvimento continua a usar o host local para `/media/...`.

---

## Variáveis de ambiente (referência)

| Onde | Variáveis principais |
|------|----------------------|
| **Django produção** | `DJANGO_SETTINGS_MODULE=config.settings.production`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `POSTGRES_*`, `CORS_ALLOWED_ORIGINS`, opcionalmente `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_CUSTOM_DOMAIN` |
| **Amplify (build)** | `VITE_API_URL` = URL base da API (HTTPS, sem `/` final) |

Ficheiros de exemplo: [`backend/.env.example`](backend/.env.example), [`frontend/.env.example`](frontend/.env.example). **Não commits** ficheiros `.env` com segredos.

---

## Endpoints principais

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/api/auth/register/` | Cadastro |
| POST | `/api/auth/token/` | Login (JWT) |
| POST | `/api/auth/token/refresh/` | Renovar access |
| GET/PATCH | `/api/users/me/` | Perfil logado |
| POST | `/api/users/me/avatar/` | Foto (multipart `avatar`) |
| POST | `/api/users/me/password/` | Trocar senha |
| GET | `/api/users/search/?page=` | Sem `q`: todos os outros utilizadores (sugestões na Explorar). |
| GET | `/api/users/search/?q=&page=` | Com `q`: filtro por substring; `q` vazio → `results` vazio. |
| GET | `/api/users/<username>/` | Perfil público |
| POST/DELETE | `/api/users/<username>/follow/` | Seguir / deixar de seguir |
| GET | `/api/users/<username>/followers/` | Seguidores |
| GET | `/api/users/<username>/following/` | A seguir |
| GET | `/api/users/<username>/posts/` | Posts do perfil |
| GET | `/api/posts/feed/` | Feed (só seguidos) |
| POST | `/api/posts/` | Criar post |
| GET/PATCH/DELETE | `/api/posts/<id>/` | Ver / editar (autor) / apagar |
| POST/DELETE | `/api/posts/<id>/like/` | Curtir / descurtir |
| GET/POST | `/api/posts/<id>/comments/` | Comentários |

---

## Licença

Projeto educacional (EBAC).
