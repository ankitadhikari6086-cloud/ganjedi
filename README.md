# Ganjedi AI

This folder contains the complete Ganjedi AI app: a React/Vite frontend and an Express API server connected to Gemini.

## Requirements

- Node.js 20 or newer
- pnpm 10.16 or newer
- A Gemini API key from Google AI Studio

## 1. Install dependencies

Open the project folder in VS Code, then run:

```bash
pnpm install
```

## 2. Add your Gemini API key

Copy `.env.example` to `.env` and replace the placeholder:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

```env
GEMINI_API_KEY=your_real_gemini_api_key
PORT=5000
```

Never commit `.env` or share it publicly.

## 3. Start the API server

In VS Code Terminal 1:

```bash
pnpm --filter @workspace/api-server run dev
```

The API runs at `http://localhost:5000`.

## 4. Start the frontend

In VS Code Terminal 2:

```bash
pnpm --filter @workspace/ganjedi-ai run dev
```

Open the local Vite URL printed in the terminal, usually:

```text
http://localhost:5173
```

The frontend automatically calls the API through `/api`.

## Useful checks

```bash
pnpm --filter @workspace/ganjedi-ai run typecheck
pnpm --filter @workspace/api-server run typecheck
curl http://localhost:5000/api/healthz
```

## Main files

- `artifacts/ganjedi-ai/src/components/ganjedi-dashboard.tsx` — complete UI and interactions
- `artifacts/ganjedi-ai/src/index.css` — responsive glassmorphism theme
- `artifacts/api-server/src/routes/tutor.ts` — Gemini chat and practice generation
- `lib/api-spec/openapi.yaml` — API contract
- `lib/api-client-react/src/generated/` — generated typed API client
## CI

GitHub Actions (`.github/workflows/ci.yml`) installs dependencies, typechecks, and builds on every push to `main` and on pull requests. No secrets are needed for CI; keep `GEMINI_API_KEY` only in your local `.env`.
