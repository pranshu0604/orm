# AI Integration in PRAN (FastAPI microservice)

This repository now uses a small FastAPI-based AI microservice located in the top-level `ai/` folder. The Next.js app no longer contains the previous in-app server action or the local AI test page — instead the frontend should call the microservice or proxy requests to it.

Overview

- Microservice: `ai/` (FastAPI + uvicorn)
- Primary endpoints:
  - `GET /v1/health` — health check
  - `POST /v1/completions` — synchronous completion (JSON body)
    - payload: `{ "prompt": "...", "max_tokens": 256, "stream": false }`
    - response: `{ "text": "..." }`
  - `POST /v1/completions?stream=true` — returns a server-sent / streaming response (SSE-style) when `stream=true`

Where the AI work happens

The FastAPI microservice wraps an OpenAI-compatible client when configured (for example, NVIDIA integrate or any OpenAI-compatible endpoint). When an upstream model endpoint is not provided, the microservice returns mock responses suitable for local development and testing.

Running the microservice (local dev)

1. Enter the `ai/` directory:

```bash
cd ai
```

2. Create and activate a virtual environment, install deps, and run:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Health check:

```bash
curl http://localhost:8000/v1/health
```

How the Next.js app should call the microservice

- Option A — Server-side (recommended): create a server action or API route that forwards requests to the microservice using `AI_SERVICE_URL` (set in your Next app `.env`). This keeps API keys and model credentials isolated in the microservice environment.
- Option B — Client-side: call the microservice directly from the browser (less secure unless you proxy through Next.js).

Example (fetching a synchronous completion from the microservice):

```js
const res = await fetch(`${process.env.AI_SERVICE_URL}/v1/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Explain online reputation', max_tokens: 128, stream: false })
});
const data = await res.json();
console.log(data.text);
```

Streaming usage

The microservice supports a streaming mode for incremental text delivery. If `stream=true` is set in the request body or query, the service returns a streaming response (SSE-style) that the frontend can read incrementally.

Security and env vars

- The microservice uses its own environment variables (see `ai/requirements.txt` and `ai/README.md`). Key variables used by the microservice include:
  - `OPENAI_COMPAT_BASE_URL` (or `MODEL_ENDPOINT`) — optional base URL for an OpenAI-compatible endpoint
  - `MODEL_API_KEY` — optional model API key
  - `MODEL_NAME` — optional model name when using OpenAI-compatible clients

- The Next.js application should set `AI_SERVICE_URL` in its `.env` (see `main/.env.example`) pointing at the microservice base URL.

Testing

- The microservice includes `ai/tests/test_main.py` (pytest) that validates `/v1/health` and `/v1/completions`. Run tests from `ai/` with `pytest` after installing dev dependencies.

Notes and rationale

- Moving AI work to a separate FastAPI microservice keeps model credentials and streaming logic isolated from the frontend codebase. It also makes it easy to swap model providers and run GPU-enabled servers separately.
- The Next.js app should be updated to call this microservice (either directly or via a server-side proxy). The previous in-app test page was updated to point at the microservice; the recommended pattern is to proxy requests server-side so that model credentials and provider configuration remain inside the microservice's environment.

See `ai/README.md` for more details about microservice configuration and deployment.

---

Last updated: October 26, 2025
