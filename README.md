# AI Model Benchmark Lab

A React benchmark dashboard with two run modes:

- Mock Test uses the built-in demo score matrix and does not require credentials.
- Live Test sends prompts to real providers through the local server runner.

## Running Locally

Install dependencies:

```bash
npm install
```

Run the dashboard and live benchmark server together:

```bash
npm run dev:full
```

The Vite app runs on `http://127.0.0.1:3000` and proxies `/api` requests to the live runner on `http://127.0.0.1:8787`.

## Runtime API Keys

Live Test mode asks the person running the benchmark to enter keys immediately before the run. The app sends those values in the request body to the local runner, uses them for that request, then clears the form state. Keys are not written to `.env`, local storage, session storage, or project files.

Supported runtime inputs:

- `OPENAI_API_KEY` for GPT via OpenAI.
- `ANTHROPIC_API_KEY` for Claude via Anthropic.
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` for Gemini via Google.
- `PERPLEXITY_API_KEY` for Perplexity.
- `OLLAMA_BASE_URL` for local Llama via Ollama, for example `http://localhost:11434`.

Providers without credentials are skipped and reported in the benchmark logs.

## Live Scoring

The first live scorer is intentionally simple. It records whether a provider returned response text, measures latency, and assigns a heuristic score from response length, basic structure, and speed. The mock score matrix remains separate from live results.

## Tests

Run the Playwright suite:

```bash
npm run test:e2e
```

Live-mode UI tests mock `/api/benchmark/live`; they do not call external AI providers.
