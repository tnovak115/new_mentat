# Corporate Travel Optimizer MVP

Startup-style B2B web application for corporate travel and lodging logistics. This MVP is optimizer-first: it collects trip requests, aggregates mock travel options, scores them against company policy and travel preferences, and presents ranked recommendations in an admin-friendly dashboard.

## Current status

- Backend migrations are configured with Alembic.
- Backend tests cover policy logic, recommendation scoring, and trip submission.
- Frontend includes loading states, client-side trip validation, and stronger admin controls.
- Remaining work is mainly runtime verification, real integrations, and production hardening.

## Implementation plan

1. Scaffold separate `frontend` and `backend` apps with shared local development setup.
2. Model core entities: companies, users, travel policies, trip requests, trip options, recommendations, and audit logs.
3. Build a FastAPI backend with mock travel provider adapters, policy validation, and a tunable recommendation engine.
4. Build a polished Next.js dashboard for trip intake, recommendations, and admin visibility into compliance and savings.
5. Seed demo data and document the local workflow so the prototype can be run quickly.

For the next-stage roadmap that turns this MVP into a B2B booking agent, see [`docs/implementation-plan.md`](docs/implementation-plan.md).
For the current product framing and customer strategy, see [`docs/product-strategy.md`](docs/product-strategy.md).

## Architecture

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL in production, SQLite fallback for quick local startup
- Integrations: adapter-based mock provider layer designed to be replaced with real APIs later
- Auth: placeholder header-based identity for MVP, structured for SSO replacement

## Repository structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- core/
|   |   |-- db/
|   |   |-- models/
|   |   |-- providers/
|   |   |-- schemas/
|   |   |-- seed/
|   |   `-- services/
|   |-- alembic/
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- types/
|   `-- Dockerfile
|-- docs/
|-- docker-compose.yml
`-- README.md
```

## MVP scope included

- Trip request intake
- Mock search aggregation for flights and trains
- Recommendation engine with tunable weights
- Company travel policy engine
- Admin dashboard with savings and compliance views
- Seed data for demo flow

## Local development

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.seed.seed_data
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000` and expects the backend at `http://localhost:8000`.

## Docker

```bash
docker compose up --build
```

## Backend tests

```bash
cd backend
pytest
```

## Database migrations

```bash
cd backend
alembic upgrade head
```

## Demo workflow

1. Open the dashboard.
2. Create or review the seeded company policy.
3. Submit a trip request from the Trips page.
4. Review ranked travel options, policy flags, and projected savings.
5. Visit the admin page to inspect trip volume and recommendation outcomes.

## Environment variables

- `backend/.env.example` contains API and database settings.
- `frontend/.env.example` contains the backend base URL for the web app.

## Notes on verification

- The backend code was checked with read-only Python syntax parsing in this environment.
- Full runtime verification still requires local dependency installation and actually starting the servers.

## Architecture choices

- SQLAlchemy instead of Prisma keeps backend business logic and persistence together in Python for this MVP.
- Providers are isolated behind adapter classes so we can replace mock data with Amadeus, rail, hotel, and ground APIs later without rewriting scoring logic.
- Recommendation and policy logic live in backend services, which keeps the UI simple and preserves a clean future path to API-first or worker-based orchestration.

## Next steps toward production SaaS

- Replace header-based auth with SSO and RBAC.
- Add async jobs and caching for provider searches.
- Introduce real provider APIs and booking handoff flows.
- Add hotel and ground transport optimization.
- Add audit-grade policy versioning and approval workflows.
- Add observability, test coverage, and CI/CD.
