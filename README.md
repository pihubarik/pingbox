# Pingbox

Monorepo layout: FastAPI backend, static frontend (served by nginx), reverse proxy.

## Local backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --app-dir .
```

Open http://127.0.0.1:8000/docs for API docs.

## Docker

```bash
docker compose up --build
```

- API: http://localhost:8000 (backend directly) or configure nginx to proxy `/api` to the backend as needed.

## Layout

- `backend/app` — FastAPI app (routers, models, schemas, WebSocket manager)
- `frontend/` — static assets for nginx
- `nginx/` — nginx configuration
