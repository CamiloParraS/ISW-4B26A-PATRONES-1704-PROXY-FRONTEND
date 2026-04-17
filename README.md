# SlopGPT Frontend

Production-oriented React frontend for the SlopGPT backend contract.

## Features

- Register and login with backend-aligned DTOs.
- Protected dashboard route with session bootstrapping.
- Chat-like prompt generation interface.
- Deterministic token estimator before submission.
- Live monthly quota progress and reset date.
- Per-minute request usage with reset countdown.
- `429` handling with temporary send lock and countdown.
- `402` handling that opens upgrade simulation modal.
- Last 7-day usage bar chart from backend history.
- Last successful response panel with metadata.

## Environment

Create `.env` from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Architecture

- `src/config`: Route and environment constants.
- `src/services`: Typed API client and endpoint-specific service modules.
- `src/types`: DTO contracts mirroring backend payloads.
- `src/features/auth`: Auth forms, validation, context, route guards.
- `src/features/dashboard`: Prompt flow, quota/rate widgets, chart, upgrade modal.
- `src/components/ui`: Shared UI primitives.
- `src/lib` and `src/hooks`: Storage/time utilities and countdown hook.

## Route Map

- `/login`
- `/register`
- `/` (protected dashboard)
- `/404` and wildcard fallback
