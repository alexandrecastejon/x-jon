# x-jon

Clone funcional estilo Twitter: API **Django + Django REST Framework** e front **React (Vite)** em monorepo (`backend/` + `frontend/`).

## Regra do feed (requisito do projeto)

O endpoint `GET /api/posts/feed/` retorna **apenas** postagens de usuários que você **segue**. **Não** inclui os seus próprios posts. Para ver o que você publicou, abra o **perfil** (`/u/<seu_usuario>`).

## Requisitos locais

- Python 3.11+ (testado com 3.14)
- Node.js 18+ e npm

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS

pip install -r requirements/dev.txt
python manage.py migrate
python manage.py createsuperuser   # opcional — admin em /admin/
python manage.py runserver
```

A API fica em `http://127.0.0.1:8000`. Prefixo: `/api/`.

### Testes

```bash
cd backend
python manage.py test apps.users apps.posts
```

### Variáveis (produção)

Copie [`backend/.env.example`](backend/.env.example) para `.env` e ajuste. Em produção defina `DJANGO_SETTINGS_MODULE=config.settings.production`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, PostgreSQL e `CORS_ALLOWED_ORIGINS`.

```bash
pip install -r requirements/prod.txt
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

O app roda em `http://127.0.0.1:5173`. Em `.env`, `VITE_API_URL` deve apontar para o mesmo host/porta do Django. A página **Explorar** (`/explorar`) mostra **perfis sugeridos** (todos os outros utilizadores) e a **busca** com debounce; ambos permitem seguir/deixar de seguir.

Build de produção:

```bash
npm run build
```

Sirva a pasta `frontend/dist/` com qualquer host estático (Nginx, Vercel, Netlify, S3, etc.).

## Deploy (sugestão)

1. **Banco:** PostgreSQL (Railway, Neon, Supabase, RDS…).
2. **Backend:** Render, Fly.io, Railway ou VPS com Gunicorn + variáveis de produção; `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS` com a URL do front.
3. **Frontend:** Vercel/Netlify com `VITE_API_URL=https://sua-api.exemplo.com`.
4. **Mídia:** em PaaS gratuito, disco efêmero some no redeploy — use bucket (S3, R2) ou serviço com volume persistente; para o curso, documente a limitação se usar só disco local.

**Link do deploy:** substitua esta linha após publicar:

- Front: _[adicione a URL]_
- API: _[adicione a URL]_

## Endpoints principais

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/api/auth/register/` | Cadastro |
| POST | `/api/auth/token/` | Login (JWT) |
| POST | `/api/auth/token/refresh/` | Renovar access |
| GET/PATCH | `/api/users/me/` | Perfil logado |
| POST | `/api/users/me/avatar/` | Foto (multipart `avatar`) |
| POST | `/api/users/me/password/` | Trocar senha |
| GET | `/api/users/search/?page=` | **Sem** `q`: lista paginada de todos os outros utilizadores (JWT), para “Perfis sugeridos” na Explorar. |
| GET | `/api/users/search/?q=&page=` | Com `q` na query: se vazio ou só espaços → `results` vazio; senão filtra por substring em `username`, `display_name` e `bio`. Exclui sempre o próprio utilizador. Rota **antes** de `/api/users/<username>/`. |
| GET | `/api/users/<username>/` | Perfil público |
| POST/DELETE | `/api/users/<username>/follow/` | Seguir / deixar de seguir |
| GET | `/api/users/<username>/followers/` | Lista de seguidores |
| GET | `/api/users/<username>/following/` | Lista de seguidos |
| GET | `/api/users/<username>/posts/` | Posts do perfil |
| GET | `/api/posts/feed/` | Feed (só seguidos) |
| POST | `/api/posts/` | Criar post |
| GET/PATCH/DELETE | `/api/posts/<id>/` | Ver / editar (autor) / apagar |
| POST/DELETE | `/api/posts/<id>/like/` | Curtir / descurtir |
| GET/POST | `/api/posts/<id>/comments/` | Listar / criar comentários |

## Licença

Projeto educacional (EBAC).
