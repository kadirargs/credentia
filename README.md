# Credentia

Credentia is a modular personal finance tracking app for managing income, expenses, categories, budgets, dashboards, analytics, and reports.

## Stack

- Backend: Python FastAPI
- Frontend: Next.js + TypeScript
- Database: PostgreSQL
- Charts: Recharts
- AI: planned for a later version

## Project Structure

```text
backend/
  app/
    api/routes/
    core/
    db/
    models/
    schemas/
    services/
    modules/
frontend/
  src/
    app/
    components/
    features/
    lib/
```

## Local Development

Quick start on Windows:

```powershell
.\start-dev.ps1
```

Or double-click `calistir.bat` from the project folder.

Stop backend/frontend:

```powershell
.\stop-dev.ps1
```

Or double-click `durdur.bat`.

The quick start script uses `backend\.venv` directly, starts PostgreSQL with Docker Compose, then starts backend and frontend. Logs are written to `logs/`.

Start PostgreSQL:

```bash
docker compose up -d db
```

Backend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default URLs:

- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`
