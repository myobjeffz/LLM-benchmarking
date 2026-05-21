import http from 'node:http';

const PORT = Number.parseInt(process.env.PORT || '8787', 10);
const DEFAULT_TIMEOUT_MS = 30_000;

const providerConfigs = [
  {
    id: 'openai',
    model: 'GPT',
    credentialKey: 'openaiApiKey',
    requiredLabel: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    buildRequest: ({ apiKey, prompt }) => ({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content ?? '',
  },
  {
    id: 'anthropic',
    model: 'Claude',
    credentialKey: 'anthropicApiKey',
    requiredLabel: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    buildRequest: ({ apiKey, prompt }) => ({
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    }),
    parseResponse: (data) =>
      data.content?.map((part) => part.text).filter(Boolean).join('\n') ?? '',
  },
  {
    id: 'google',
    model: 'Gemini',
    credentialKey: 'geminiApiKey',
    requiredLabel: 'GOOGLE_API_KEY or GEMINI_API_KEY',
    getEndpoint: ({ apiKey }) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    buildRequest: ({ prompt }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }),
    parseResponse: (data) =>
      data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') ?? '',
  },
  {
    id: 'perplexity',
    model: 'Perplexity',
    credentialKey: 'perplexityApiKey',
    requiredLabel: 'PERPLEXITY_API_KEY',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    buildRequest: ({ apiKey, prompt }) => ({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content ?? '',
  },
  {
    id: 'ollama',
    model: 'Llama',
    credentialKey: 'ollamaBaseUrl',
    requiredLabel: 'OLLAMA_BASE_URL',
    optional: true,
    getEndpoint: ({ apiKey }) => `${apiKey.replace(/\/$/, '')}/api/generate`,
    buildRequest: ({ prompt }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt,
        stream: false,
      }),
    }),
    parseResponse: (data) => data.response ?? '',
  },
];

const jsonResponse = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (body.length > 200_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    request.on('error', reject);
  });

const sanitizeError = (error) =>
  error.message
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]')
    .replace(/AIza[a-zA-Z0-9_-]+/g, '[redacted]')
    .replace(/pplx-[a-zA-Z0-9_-]+/g, '[redacted]');

const scoreResponse = ({ responseText, latencyMs }) => {
  if (!responseText) {
    return 0;
  }

  const lengthScore = Math.min(45, Math.round(responseText.length / 12));
  const structureScore = /[\n:.-]/.test(responseText) ? 20 : 10;
  const latencyScore = latencyMs < 2_000 ? 35 : latencyMs < 5_000 ? 25 : 15;

  return Math.min(100, lengthScore + structureScore + latencyScore);
};

const callProvider = async ({ config, credential, prompts }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const endpoint = config.getEndpoint
    ? config.getEndpoint({ apiKey: credential })
    : config.endpoint;
  const startedAt = performance.now();

  try {
    const promptResults = [];

    for (const prompt of prompts) {
      const promptStartedAt = performance.now();
      const providerResponse = await fetch(endpoint, {
        ...config.buildRequest({ apiKey: credential, prompt }),
        signal: controller.signal,
      });
      const promptLatencyMs = Math.round(performance.now() - promptStartedAt);
      const data = await providerResponse.json().catch(() => ({}));

      if (!providerResponse.ok) {
        promptResults.push({
          status: 'error',
          latencyMs: promptLatencyMs,
          score: 0,
          responseLength: 0,
          message: `${config.model} returned ${providerResponse.status}.`,
        });
        continue;
      }

      const responseText = config.parseResponse(data);
      promptResults.push({
        status: responseText ? 'ok' : 'error',
        latencyMs: promptLatencyMs,
        score: scoreResponse({ responseText, latencyMs: promptLatencyMs }),
        responseLength: responseText.length,
        message: responseText ? 'Response received.' : 'No response text returned.',
      });
    }

    const latencyMs = Math.round(performance.now() - startedAt);
    const successfulPrompts = promptResults.filter((result) => result.status === 'ok');
    const totalResponseLength = promptResults.reduce(
      (total, result) => total + result.responseLength,
      0,
    );
    const averageScore = successfulPrompts.length
      ? Math.round(
          successfulPrompts.reduce((total, result) => total + result.score, 0) /
            successfulPrompts.length,
        )
      : 0;

    return {
      provider: config.id,
      model: config.model,
      status: successfulPrompts.length ? 'ok' : 'error',
      latencyMs,
      score: averageScore,
      promptCount: prompts.length,
      responseLength: totalResponseLength,
      message: successfulPrompts.length
        ? `${successfulPrompts.length}/${prompts.length} prompt(s) returned response text.`
        : promptResults[0]?.message ?? 'No response text returned.',
    };
  } catch (error) {
    return {
      provider: config.id,
      model: config.model,
      status: 'error',
      latencyMs: Math.round(performance.now() - startedAt),
      score: 0,
      message: sanitizeError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
};

const buildScoreDetails = (results) => {
  const completed = results.filter((result) => result.status === 'ok');
  const averageScore = completed.length
    ? Math.round(
        completed.reduce((total, result) => total + result.score, 0) / completed.length,
      )
    : 0;

  return {
    baselineScore: 0,
    updatedScore: averageScore,
    formula: `round(avg(${completed.length} live provider score(s))) = ${averageScore}`,
  };
};

const runLiveBenchmark = async ({ credentials = {}, prompts = [], target = {} }) => {
  const promptList = prompts.length
    ? prompts
    : ['Briefly explain your strongest capability for benchmark testing.'];
  const runnableProviders = providerConfigs.filter((config) => {
    const credential = credentials[config.credentialKey]?.trim();
    return Boolean(credential);
  });

  if (!runnableProviders.length) {
    return {
      statusCode: 400,
      body: {
        error:
          'Provide at least one runtime API key or Ollama base URL before starting a live benchmark.',
      },
    };
  }

  const results = await Promise.all(
    runnableProviders.map((config) =>
      callProvider({
        config,
        credential: credentials[config.credentialKey].trim(),
        prompts: promptList,
      }),
    ),
  );
  const skippedProviders = providerConfigs
    .filter((config) => !credentials[config.credentialKey]?.trim())
    .map((config) => `${config.model} skipped: missing ${config.requiredLabel}.`);
  const logs = [
    `Loaded ${promptList.length} prompt(s) for ${target.name || 'Live Benchmark'}.`,
    ...runnableProviders.map((config) => `Calling ${config.model}.`),
    ...results.map((result) =>
      result.status === 'ok'
        ? `${result.model} returned 200 in ${result.latencyMs}ms.`
        : `${result.model} failed: ${result.message}`,
    ),
    ...skippedProviders,
  ];

  return {
    statusCode: 200,
    body: {
      summary: {
        targetName: target.name || 'Live Benchmark',
        promptCount: promptList.length,
        providerCount: results.length,
      },
      results,
      logs,
      scoreDetails: buildScoreDetails(results),
    },
  };
};

const server = http.createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/benchmark/live') {
    try {
      const body = await readJsonBody(request);
      const result = await runLiveBenchmark(body);
      jsonResponse(response, result.statusCode, result.body);
    } catch (error) {
      jsonResponse(response, 400, { error: sanitizeError(error) });
    }

    return;
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    jsonResponse(response, 200, { status: 'ok' });
    return;
  }

  jsonResponse(response, 404, { error: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`Live benchmark runner listening on http://127.0.0.1:${PORT}`);
});
