# MVP Architecture Notes

## Design goals

- Keep business logic separate from UI rendering.
- Make travel data providers swappable.
- Prefer a structure that can grow into a production SaaS platform without making the MVP heavy.

## Backend

- `api/routes`: HTTP endpoints only
- `services`: recommendation, policy, and admin business logic
- `providers`: mock adapter layer that can later wrap flights, rail, hotel, and ground APIs
- `models`: SQLAlchemy entities
- `schemas`: request and response contracts

## Frontend

- `app`: route-level pages
- `components`: dashboard, admin, and recommendation UI pieces
- `lib/api.ts`: single place for backend API calls
- `types`: API response types

## Upgrade path

- Replace mock adapters with real provider connectors.
- Move search and optimization into async background jobs.
- Add auth middleware, RBAC, and SSO.
- Add migrations with Alembic once schema churn slows down.
