import { useEffect, useRef, useState } from 'react';

const models = [
  {
    name: 'GPT',
    scores: { coding: 92, creativity: 95, reasoning: 90, research: 88 },
    costs: {
      coding: '$0.18',
      creativity: '$0.14',
      reasoning: '$0.16',
      research: '$0.20',
    },
    trend: '+4%',
  },
  {
    name: 'Claude',
    scores: { coding: 97, creativity: 82, reasoning: 95, research: 84 },
    costs: {
      coding: '$0.22',
      creativity: '$0.15',
      reasoning: '$0.21',
      research: '$0.19',
    },
    trend: '+2%',
  },
  {
    name: 'Gemini',
    scores: { coding: 84, creativity: 89, reasoning: 87, research: 93 },
    costs: {
      coding: '$0.10',
      creativity: '$0.11',
      reasoning: '$0.12',
      research: '$0.13',
    },
    trend: '+6%',
  },
  {
    name: 'Llama',
    scores: { coding: 73, creativity: 74, reasoning: 70, research: 68 },
    costs: {
      coding: '$0.04',
      creativity: '$0.03',
      reasoning: '$0.04',
      research: '$0.05',
    },
    trend: '-1%',
  },
  {
    name: 'Perplexity',
    scores: { coding: 65, creativity: 58, reasoning: 76, research: 98 },
    costs: {
      coding: '$0.09',
      creativity: '$0.07',
      reasoning: '$0.10',
      research: '$0.15',
    },
    trend: '+8%',
  },
];

const initialWeeklyHistory = [
  { week: 'Week 1', GPT: 82, Claude: 84, Gemini: 79, Llama: 65, Perplexity: 71 },
  { week: 'Week 2', GPT: 85, Claude: 88, Gemini: 82, Llama: 66, Perplexity: 75 },
  { week: 'Week 3', GPT: 88, Claude: 91, Gemini: 85, Llama: 68, Perplexity: 80 },
  { week: 'Week 4', GPT: 91, Claude: 93, Gemini: 89, Llama: 70, Perplexity: 84 },
];

const prompts = [
  {
    category: 'Coding',
    prompt: 'Build a Python automation script that cleans CSV data and generates analytics.',
  },
  {
    category: 'Research',
    prompt: 'Explain the future of AI agents in cybersecurity over 5 years.',
  },
  {
    category: 'Creative',
    prompt: 'Write a cinematic intro for a cyberpunk documentary.',
  },
  {
    category: 'Business',
    prompt: 'Create a scalable AI business capable of reaching $10k/month.',
  },
];

const liveCredentialFields = [
  {
    id: 'openaiApiKey',
    label: 'OPENAI_API_KEY',
    provider: 'GPT',
    placeholder: 'sk-...',
    helper: 'Required to test GPT models through OpenAI.',
  },
  {
    id: 'anthropicApiKey',
    label: 'ANTHROPIC_API_KEY',
    provider: 'Claude',
    placeholder: 'sk-ant-...',
    helper: 'Required to test Claude models through Anthropic.',
  },
  {
    id: 'geminiApiKey',
    label: 'GOOGLE_API_KEY or GEMINI_API_KEY',
    provider: 'Gemini',
    placeholder: 'AIza...',
    helper: 'Required to test Gemini models through Google.',
  },
  {
    id: 'perplexityApiKey',
    label: 'PERPLEXITY_API_KEY',
    provider: 'Perplexity',
    placeholder: 'pplx-...',
    helper: 'Required to test Perplexity online models.',
  },
  {
    id: 'ollamaBaseUrl',
    label: 'OLLAMA_BASE_URL',
    provider: 'Llama',
    placeholder: 'http://localhost:11434',
    helper: 'Optional local endpoint for Llama via Ollama.',
    optional: true,
  },
];

const emptyLiveCredentials = Object.fromEntries(
  liveCredentialFields.map((field) => [field.id, '']),
);

const initialPromptLibraries = [
  {
    name: 'Coding Stress Tests',
    prompts: 42,
    description: 'Advanced debugging, refactoring, architecture, and automation prompts.',
  },
  {
    name: 'Reasoning & Logic',
    prompts: 31,
    description: 'Multi-step reasoning, ambiguity handling, and chain-of-thought evaluations.',
  },
  {
    name: 'Creative Writing',
    prompts: 28,
    description: 'Storytelling, cinematic scripts, ad copy, hooks, and viral content prompts.',
  },
  {
    name: 'Research & Analysis',
    prompts: 37,
    description: 'Fact-checking, summarization, strategic analysis, and report generation tests.',
  },
  {
    name: 'Business & Strategy',
    prompts: 24,
    description: 'Startup ideas, growth plans, monetization systems, and AI business models.',
  },
  {
    name: 'Agentic AI Tasks',
    prompts: 19,
    description: 'Autonomous workflows, memory retention, planning, and tool-usage tests.',
  },
];

const initialLibraryPrompts = {
  'Coding Stress Tests': [
    'Refactor a messy React component into reusable hooks and components.',
    'Debug a Python script that fails on missing CSV values.',
    'Design a scalable API rate limiter for a SaaS app.',
  ],
  'Reasoning & Logic': [
    'Solve a multi-step scheduling conflict with changing constraints.',
    'Compare two flawed arguments and identify hidden assumptions.',
    'Explain the shortest path through a weighted network.',
  ],
  'Creative Writing': [
    'Write a cold open for a cyberpunk documentary.',
    'Create five viral hooks for an AI automation product.',
    'Rewrite a product launch script in three distinct tones.',
  ],
  'Research & Analysis': [
    'Summarize recent AI agent trends and list business risks.',
    'Compare model strengths for legal, medical, and finance research.',
    'Fact-check an AI-generated market analysis report.',
  ],
  'Business & Strategy': [
    'Create a 90-day plan for an AI micro-SaaS product.',
    'Design a pricing strategy for a prompt testing platform.',
    'Identify three acquisition channels for an AI consulting offer.',
  ],
  'Agentic AI Tasks': [
    'Plan a multi-step workflow that uses browser, files, and memory.',
    'Evaluate how well an agent recovers from tool failures.',
    'Test whether an agent can preserve goals across long tasks.',
  ],
};

const futureFeatures = [
  'API integrations',
  'Live response timing',
  'Hallucination detector',
  'Prompt versioning',
  'Leaderboard mode',
  'AI agent benchmarks',
  'Export reports',
  'Auto-generated summaries',
];

const averageScore = (scores) => {
  const vals = Object.values(scores);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

const metricNames = Object.keys(models[0].scores);
const allModelMetricScores = models.flatMap((model) => Object.values(model.scores));
const modelAverageScores = models.map((model) => averageScore(model.scores));
const baselineBenchmarkScore = Math.round(
  modelAverageScores.reduce((total, score) => total + score, 0) / modelAverageScores.length,
);
const fullMatrixBenchmarkScore = Math.round(
  allModelMetricScores.reduce((total, score) => total + score, 0) / allModelMetricScores.length,
);

const getPreviousWeeklyScore = (historyRows) =>
  Math.round(
    Object.entries(historyRows.at(-1))
    .filter(([key]) => key !== 'week')
    .reduce((total, [, score]) => total + score, 0) /
      models.length,
  );

const calculateBenchmarkScore = (library) => {
  const promptCoverageBonus = Math.min(5, Math.round(library.prompts / 12));
  const updatedScore = Math.min(100, baselineBenchmarkScore + promptCoverageBonus);

  return {
    baselineScore: baselineBenchmarkScore,
    promptCoverageBonus,
    updatedScore,
    formula: `round(avg(model scores)) + prompt coverage bonus = ${baselineBenchmarkScore} + ${promptCoverageBonus}`,
  };
};

const calculateFullBenchmarkScore = (historyRows) => {
  const metricAverages = metricNames.map((metric) => {
    const metricTotal = models.reduce((total, model) => total + model.scores[metric], 0);

    return {
      metric,
      score: Math.round(metricTotal / models.length),
    };
  });

  return {
    baselineScore: getPreviousWeeklyScore(historyRows),
    metricAverages,
    updatedScore: fullMatrixBenchmarkScore,
    formula: `round(sum(${models.length} models x ${metricNames.length} metrics) / ${allModelMetricScores.length}) = ${fullMatrixBenchmarkScore}`,
  };
};

const emptyPromptPack = {
  name: '',
  prompts: '12',
  description: '',
  samplePrompts: '',
};

const formatLogTime = () =>
  new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

const formatBenchmarkRunLabel = () =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

const createTrendRow = (scores) => ({
  week: formatBenchmarkRunLabel(),
  isCurrentRun: true,
  ...scores,
});

export default function AIModelBenchmarkDashboard() {
  const [splashOpen, setSplashOpen] = useState(true);
  const [benchmarkMode, setBenchmarkMode] = useState('mock');
  const [weeklyTrendRows, setWeeklyTrendRows] = useState(initialWeeklyHistory);
  const [libraries, setLibraries] = useState(initialPromptLibraries);
  const [libraryPromptMap, setLibraryPromptMap] = useState(initialLibraryPrompts);
  const [selectedLibrary, setSelectedLibrary] = useState(initialPromptLibraries[0]);
  const [libraryModal, setLibraryModal] = useState(null);
  const [addPackModalOpen, setAddPackModalOpen] = useState(false);
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);
  const [liveCredentialsModalOpen, setLiveCredentialsModalOpen] = useState(false);
  const [liveRunTarget, setLiveRunTarget] = useState(null);
  const [liveCredentials, setLiveCredentials] = useState(emptyLiveCredentials);
  const [newPromptPack, setNewPromptPack] = useState(emptyPromptPack);
  const [runResult, setRunResult] = useState(null);
  const [testLogs, setTestLogs] = useState([
    {
      id: 'idle',
      time: formatLogTime(),
      message: 'Benchmark runner idle. Start a benchmark to stream test progress here.',
    },
  ]);
  const [runProgress, setRunProgress] = useState(0);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);
  const logTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      logTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  const appendLog = (message) => {
    setTestLogs((currentLogs) => [
      ...currentLogs,
      {
        id: `${Date.now()}-${message}`,
        time: formatLogTime(),
        message,
      },
    ]);
  };

  const startBenchmarkLog = (runTarget, options = {}) => {
    logTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    logTimersRef.current = [];

    setIsBenchmarkRunning(true);
    setRunProgress(10);
    setTestLogs([
      {
        id: `${Date.now()}-start`,
        time: formatLogTime(),
        message: `Starting benchmark for ${runTarget.name}.`,
      },
    ]);

    const logSteps = [
      {
        delay: 700,
        progress: 25,
        message: runTarget.isFullBenchmark
          ? `Loaded ${models.length} models and ${metricNames.length} scoring metrics.`
          : `Loaded ${runTarget.prompts} prompts from ${runTarget.name}.`,
      },
      {
        delay: 1400,
        progress: 45,
        message: runTarget.isFullBenchmark
          ? `Running ${allModelMetricScores.length} model-metric checks across coding, creativity, reasoning, and research.`
          : `Distributing prompts to ${models.length} model APIs.`,
      },
      {
        delay: 2100,
        progress: 65,
        message: runTarget.isFullBenchmark
          ? 'Collecting metric scores for every model in the benchmark matrix.'
          : 'Collecting model responses and timing results.',
      },
      {
        delay: 2800,
        progress: 85,
        message: runTarget.isFullBenchmark
          ? 'Calculating the updated benchmark score from all model and metric scores.'
          : 'Scoring quality, cost, reasoning, and reliability metrics.',
      },
      {
        delay: 3500,
        progress: 100,
        message: `Benchmark complete for ${runTarget.name}. Results are ready in Test Run Status.`,
        complete: true,
      },
    ];

    logTimersRef.current = logSteps.map((step) =>
      setTimeout(() => {
        setRunProgress(step.progress);
        appendLog(step.message);

        if (step.complete) {
          setIsBenchmarkRunning(false);
          options.onComplete?.();
        }
      }, step.delay),
    );
  };

  const handleViewLibrary = (library) => {
    setSelectedLibrary(library);
    setLibraryModal(library);
  };

  const createFullBenchmarkTarget = () => ({
    name: 'Full Model Benchmark',
    isFullBenchmark: true,
    promptCount: allModelMetricScores.length,
    samplePrompts: prompts.map((item) => item.prompt),
  });

  const openLiveCredentials = (runTarget) => {
    logTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    logTimersRef.current = [];
    setLiveRunTarget(runTarget);
    setLiveCredentials(emptyLiveCredentials);
    setLiveCredentialsModalOpen(true);
  };

  const closeLiveCredentials = () => {
    setLiveCredentialsModalOpen(false);
    setLiveRunTarget(null);
    setLiveCredentials(emptyLiveCredentials);
  };

  const getTrendScoreClass = (row, rowIndex, modelName) => {
    if (!row.isCurrentRun) {
      return '';
    }

    const previousRow = weeklyTrendRows[rowIndex - 1];
    const didBeatPrevious = previousRow && row[modelName] > previousRow[modelName];

    return didBeatPrevious
      ? 'font-bold text-amber-300'
      : 'font-semibold text-green-400';
  };

  const runLiveBenchmark = async (event) => {
    event.preventDefault();

    if (!liveRunTarget) {
      return;
    }

    const trimmedCredentials = Object.fromEntries(
      Object.entries(liveCredentials).map(([key, value]) => [key, value.trim()]),
    );
    const enabledProviders = liveCredentialFields.filter(
      (field) => trimmedCredentials[field.id],
    );
    const promptList = liveRunTarget.isFullBenchmark
      ? prompts.map((item) => item.prompt)
      : libraryPromptMap[liveRunTarget.name] ?? [];

    setLiveCredentialsModalOpen(false);
    setRunProgress(15);
    setIsBenchmarkRunning(true);
    setRunResult({
      libraryName: liveRunTarget.name,
      modelCount: enabledProviders.length,
      promptCount: promptList.length,
      estimatedMinutes: Math.max(1, enabledProviders.length),
      status: 'Live Running',
      liveResults: [],
    });
    setTestLogs([
      {
        id: `${Date.now()}-live-start`,
        time: formatLogTime(),
        message: `Starting live benchmark for ${liveRunTarget.name}.`,
      },
      {
        id: `${Date.now()}-live-keys`,
        time: formatLogTime(),
        message: `Using ${enabledProviders.length} runtime credential set(s). Keys will be cleared after this request.`,
      },
    ]);

    try {
      const response = await fetch('/api/benchmark/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: {
            name: liveRunTarget.name,
            isFullBenchmark: Boolean(liveRunTarget.isFullBenchmark),
          },
          credentials: trimmedCredentials,
          prompts: promptList,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Live benchmark failed.');
      }

      setRunProgress(100);
      setRunResult({
        libraryName: liveRunTarget.name,
        modelCount: payload.results.length,
        promptCount: payload.summary.promptCount,
        estimatedMinutes: Math.max(1, payload.results.length),
        scoreDetails: payload.scoreDetails,
        status: 'Live Complete',
        liveResults: payload.results,
      });
      setTestLogs((currentLogs) => [
        ...currentLogs,
        ...payload.logs.map((message) => ({
          id: `${Date.now()}-${message}`,
          time: formatLogTime(),
          message,
        })),
        {
          id: `${Date.now()}-live-complete`,
          time: formatLogTime(),
          message: `Live benchmark complete for ${liveRunTarget.name}. Results are ready in Test Run Status.`,
        },
      ]);

      if (liveRunTarget.isFullBenchmark) {
        setWeeklyTrendRows((currentRows) => [
          ...currentRows,
          createTrendRow(
            Object.fromEntries(
              models.map((model) => {
                const result = payload.results.find((item) => item.model === model.name);
                return [model.name, result?.score ?? averageScore(model.scores)];
              }),
            ),
          ),
        ]);
      }
    } catch (error) {
      setRunProgress(100);
      setRunResult((currentResult) => ({
        ...currentResult,
        status: 'Live Failed',
        error: error.message,
      }));
      appendLog(`Live benchmark failed: ${error.message}`);
    } finally {
      setIsBenchmarkRunning(false);
      setLiveRunTarget(null);
      setLiveCredentials(emptyLiveCredentials);
    }
  };

  const handleRunTests = (library, options = {}) => {
    if (benchmarkMode === 'live') {
      setSelectedLibrary(library);
      openLiveCredentials({
        ...library,
        samplePrompts: libraryPromptMap[library.name] ?? [],
      });
      return;
    }

    const estimatedMinutes = Math.max(3, Math.round(library.prompts / 8));
    const scoreDetails = calculateBenchmarkScore(library);

    setSelectedLibrary(library);
    setRunResult({
      libraryName: library.name,
      modelCount: models.length,
      promptCount: library.prompts,
      estimatedMinutes,
      scoreDetails,
      status: 'Queued',
    });
    startBenchmarkLog(library);

    if (options.showSummary) {
      setBenchmarkModalOpen(true);
    }
  };

  const handleRunNewBenchmark = () => {
    const fullBenchmarkTarget = createFullBenchmarkTarget();

    if (benchmarkMode === 'live') {
      openLiveCredentials(fullBenchmarkTarget);
      return;
    }

    const scoreDetails = calculateFullBenchmarkScore(weeklyTrendRows);

    setRunResult({
      libraryName: fullBenchmarkTarget.name,
      modelCount: models.length,
      metricCount: metricNames.length,
      promptCount: allModelMetricScores.length,
      estimatedMinutes: Math.max(3, metricNames.length * models.length),
      scoreDetails,
      status: 'Queued',
    });
    startBenchmarkLog(fullBenchmarkTarget, {
      onComplete: () => {
        setWeeklyTrendRows((currentRows) => [
          ...currentRows,
          createTrendRow(
            Object.fromEntries(
              models.map((model) => [model.name, averageScore(model.scores)]),
            ),
          ),
        ]);
      },
    });
    setBenchmarkModalOpen(true);
  };

  const handleCreatePromptPack = (event) => {
    event.preventDefault();

    const name = newPromptPack.name.trim();
    const description = newPromptPack.description.trim();
    const promptCount = Math.max(1, Number.parseInt(newPromptPack.prompts, 10) || 1);

    if (!name || !description) {
      return;
    }

    const samplePrompts = newPromptPack.samplePrompts
      .split('\n')
      .map((prompt) => prompt.trim())
      .filter(Boolean);

    const library = {
      name,
      prompts: promptCount,
      description,
    };

    setLibraries((currentLibraries) => [...currentLibraries, library]);
    setLibraryPromptMap((currentPrompts) => ({
      ...currentPrompts,
      [name]: samplePrompts.length
        ? samplePrompts
        : [
            `Evaluate model quality for the ${name} benchmark pack.`,
            `Compare speed, cost, and accuracy for ${name}.`,
            `Summarize strengths and weaknesses discovered in ${name}.`,
          ],
    }));
    setSelectedLibrary(library);
    setNewPromptPack(emptyPromptPack);
    setAddPackModalOpen(false);
  };

  const benchmarkLogsSection = (
    <section
      className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      data-testid="benchmark-log-window"
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Benchmark Logs</h2>
          <p className="mt-1 text-sm text-slate-400">
            Live background progress for the current benchmark run.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            isBenchmarkRunning
              ? 'bg-green-500/10 text-green-300'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          {isBenchmarkRunning ? 'Running' : 'Idle'}
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
          <span>Progress</span>
          <span>{runProgress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${runProgress}%` }}
          />
        </div>
      </div>

      {runResult?.scoreDetails && (
        <div
          className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 md:grid-cols-3"
          data-testid="score-calculation"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Score Formula
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 md:col-span-2">
              {runResult.scoreDetails.formula}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Previous Score
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-300">
              {runResult.scoreDetails.baselineScore}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-green-400">
              Updated Score
            </p>
            <p className="mt-2 text-4xl font-bold text-blue-400">
              {runResult.scoreDetails.updatedScore}
            </p>
          </div>

          {runResult.scoreDetails.metricAverages && (
            <div className="md:col-span-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Metric Averages
              </p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {runResult.scoreDetails.metricAverages.map(({ metric, score }) => (
                  <div key={metric} className="rounded-xl bg-slate-800 p-3">
                    <p className="text-xs capitalize text-slate-400">{metric}</p>
                    <p className="mt-1 text-xl font-bold text-slate-100">{score}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm">
        {testLogs.map((log) => (
          <div key={log.id} className="flex gap-3 text-slate-300">
            <span className="shrink-0 text-slate-500">[{log.time}]</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold">AI Model Benchmark Lab</h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Automated testing dashboard for comparing AI models across coding,
              research, creativity, and reasoning.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="flex rounded-2xl border border-slate-700 bg-slate-900 p-1"
              data-testid="benchmark-mode-toggle"
            >
              {['mock', 'live'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                    benchmarkMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={() => setBenchmarkMode(mode)}
                >
                  {mode} Test
                </button>
              ))}
            </div>

            <button
              type="button"
              className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold shadow-lg transition hover:bg-blue-500"
              onClick={handleRunNewBenchmark}
            >
              Run New Benchmark
            </button>
          </div>
        </header>

        {benchmarkMode === 'live' && (
          <section
            className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5 shadow-xl"
            data-testid="live-mode-notice"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-300">
                  Live Test Mode
                </p>
                <h2 className="mt-1 text-xl font-bold">Runtime API keys required</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Keys are entered only when a live run starts, sent to the local
                  benchmark runner, and cleared from the form after the request.
                </p>
              </div>
              <div className="text-sm text-slate-300">
                OpenAI, Anthropic, Gemini, Perplexity, and optional Ollama are supported.
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {models.map((model) => (
            <article
              key={model.name}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{model.name}</h2>
                <span
                  className={`text-sm font-semibold ${
                    model.trend.startsWith('-') ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {model.trend}
                </span>
              </div>

              <div className="mb-4 text-5xl font-bold">{averageScore(model.scores)}</div>

              <div className="space-y-3">
                {Object.entries(model.scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm capitalize">
                      <span>{key}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{model.costs[key]}</span>
                        <span>{value}</span>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        {benchmarkLogsSection}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Weekly Benchmark Trends</h2>
              <p className="mt-1 text-sm text-slate-400">
                Historical comparison across previous benchmark runs.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-sm text-slate-400">
                    <th className="py-3">Run Date</th>
                    <th>GPT</th>
                    <th>Claude</th>
                    <th>Gemini</th>
                    <th>Llama</th>
                    <th>Perplexity</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyTrendRows.map((week, rowIndex) => (
                    <tr
                      key={week.week}
                      className="border-b border-slate-800 transition hover:bg-slate-800/30"
                    >
                      <td className="py-4 font-medium">{week.week}</td>
                      {models.map((model) => (
                        <td
                          key={model.name}
                          className={getTrendScoreClass(week, rowIndex, model.name)}
                          data-testid={`trend-score-${rowIndex}-${model.name}`}
                        >
                          {week[model.name]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold">Automated Test Queue</h2>

            <div className="space-y-4">
              {prompts.map((item) => (
                <div
                  key={item.category}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-blue-400">
                      {item.category}
                    </span>

                    <span className="text-xs text-green-400">Ready</span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-300">{item.prompt}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Prompt Libraries</h2>
              <p className="mt-1 text-sm text-slate-400">
                Reusable benchmark prompt collections for consistent AI testing.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
              onClick={() => setAddPackModalOpen(true)}
            >
              Add Prompt Pack
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {libraries.map((library) => (
              <article
                key={library.name}
                data-testid={`library-card-${library.name}`}
                className={`rounded-2xl border bg-slate-800 p-5 transition hover:border-blue-500 ${
                  selectedLibrary.name === library.name
                    ? 'border-blue-500'
                    : 'border-slate-700'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">{library.name}</h3>
                  <span className="shrink-0 text-sm font-semibold text-blue-400">
                    {library.prompts} Prompts
                  </span>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-slate-400">
                  {library.description}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-500"
                    onClick={() => handleRunTests(library)}
                  >
                    Run Tests
                  </button>

                  <button
                    type="button"
                    className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium transition hover:bg-slate-600"
                    onClick={() => handleViewLibrary(library)}
                  >
                    View Library
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-2">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-400">Viewing Library</p>
                <h2 className="mt-1 text-2xl font-bold">{selectedLibrary.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {selectedLibrary.description}
                </p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                {selectedLibrary.prompts} prompts
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {libraryPromptMap[selectedLibrary.name].map((prompt) => (
                <div
                  key={prompt}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm leading-relaxed text-slate-300"
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            data-testid="test-run-status"
          >
            <h2 className="mb-4 text-2xl font-bold">Test Run Status</h2>

            {runResult ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                  <p className="text-sm text-green-300">{runResult.status}</p>
                  <p className="mt-1 font-semibold">{runResult.libraryName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-800 p-4">
                    <p className="text-slate-400">Models</p>
                    <p className="mt-1 text-2xl font-bold">{runResult.modelCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-800 p-4">
                    <p className="text-slate-400">
                      {runResult.metricCount ? 'Metrics' : 'Prompts'}
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {runResult.metricCount ?? runResult.promptCount}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-800 p-4">
                    <p className="text-slate-400">
                      {runResult.metricCount ? 'Model-Metric Checks' : 'Estimated Runtime'}
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {runResult.metricCount
                        ? runResult.promptCount
                        : `${runResult.estimatedMinutes} minutes`}
                    </p>
                  </div>
                </div>

                {runResult.error && (
                  <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {runResult.error}
                  </p>
                )}

                {runResult.liveResults?.length > 0 && (
                  <div
                    className="space-y-2 rounded-2xl border border-slate-700 bg-slate-800 p-4"
                    data-testid="live-results"
                  >
                    <p className="text-sm font-semibold text-slate-200">Live Results</p>
                    {runResult.liveResults.map((result) => (
                      <div
                        key={result.provider}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-medium">{result.model}</span>
                        <span className={result.status === 'ok' ? 'text-green-300' : 'text-amber-300'}>
                          {result.status === 'ok'
                            ? `${result.score}/100 in ${result.latencyMs}ms`
                            : result.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-800 p-4 text-sm leading-relaxed text-slate-400">
                Click `Run Tests` on any prompt library to queue a benchmark run.
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold">Benchmark Automation Pipeline</h2>

            <div className="space-y-4 text-slate-300">
              {[
                ['1. Prompt Distribution', 'Sends identical prompts to every AI model API simultaneously.'],
                ['2. Response Analysis', 'Evaluates quality, hallucinations, formatting, logic, and speed.'],
                ['3. Scoring Engine', 'Generates weighted scores and calculates benchmark rankings.'],
                ['4. Weekly Tracking', 'Stores historical results for trend analysis and comparisons.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl bg-slate-800 p-4">
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold">Future Features</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {futureFeatures.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{feature}</span>
                    <span className="text-blue-400">Planned</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {splashOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          data-testid="splash-screen"
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-blue-500/30 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900 p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
                Before You Benchmark
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">
                How real model testing works
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                This app can show demo benchmark results immediately, but cloud LLMs
                cannot be auto-detected without authenticated access. To run real tests
                against GPT, Claude, Gemini, or Perplexity, the person running the test
                must provide API keys for that run.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:p-8">
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm font-semibold text-blue-300">Mock Test</p>
                <h3 className="mt-2 text-xl font-bold">No keys needed</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Uses built-in sample scores so anyone can explore the dashboard and
                  understand the benchmark workflow.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm font-semibold text-green-300">Local Test</p>
                <h3 className="mt-2 text-xl font-bold">Local models only</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Local tools like Ollama can be tested without cloud API keys when
                  they are running on the user's machine.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm font-semibold text-amber-300">Live Test</p>
                <h3 className="mt-2 text-xl font-bold">Runtime keys required</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Hosted providers require API keys. Keys are entered at run time, sent
                  to the benchmark runner, and cleared after the request.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/60 p-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm leading-relaxed text-slate-400">
                No API keys means no real cloud LLM benchmarking, unless the model is
                local or the app owner configures shared provider credentials.
              </p>
              <button
                type="button"
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                onClick={() => setSplashOpen(false)}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {libraryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          data-testid="library-modal"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-400">Prompt Library</p>
                <h2 className="mt-1 text-3xl font-bold">{libraryModal.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {libraryModal.description}
                </p>
              </div>

              <button
                type="button"
                className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold transition hover:bg-slate-700"
                onClick={() => setLibraryModal(null)}
              >
                Close
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                {libraryModal.prompts} total prompts
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                Showing sample test prompts
              </span>
            </div>

            <div className="space-y-3">
              {libraryPromptMap[libraryModal.name].map((prompt, index) => (
                <div
                  key={prompt}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Test Prompt {index + 1}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-200">{prompt}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
                onClick={() => {
                  handleRunTests(libraryModal);
                  setLibraryModal(null);
                }}
              >
                Run Tests With This Library
              </button>
            </div>
          </div>
        </div>
      )}

      {addPackModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          data-testid="add-pack-modal"
        >
          <form
            className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onSubmit={handleCreatePromptPack}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-400">New Library</p>
                <h2 className="mt-1 text-3xl font-bold">Add Prompt Pack</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Create a reusable benchmark prompt collection that can be viewed and run.
                </p>
              </div>

              <button
                type="button"
                className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold transition hover:bg-slate-700"
                onClick={() => setAddPackModalOpen(false)}
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Pack Name
                </span>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  name="packName"
                  required
                  value={newPromptPack.name}
                  onChange={(event) =>
                    setNewPromptPack((pack) => ({ ...pack, name: event.target.value }))
                  }
                  placeholder="Security Evaluation"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Prompt Count
                </span>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  min="1"
                  name="promptCount"
                  required
                  type="number"
                  value={newPromptPack.prompts}
                  onChange={(event) =>
                    setNewPromptPack((pack) => ({ ...pack, prompts: event.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </span>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  name="description"
                  required
                  value={newPromptPack.description}
                  onChange={(event) =>
                    setNewPromptPack((pack) => ({
                      ...pack,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Prompts for testing security analysis and threat modeling."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Sample Prompts
                </span>
                <textarea
                  className="min-h-32 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  name="samplePrompts"
                  value={newPromptPack.samplePrompts}
                  onChange={(event) =>
                    setNewPromptPack((pack) => ({
                      ...pack,
                      samplePrompts: event.target.value,
                    }))
                  }
                  placeholder="Add one sample prompt per line."
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-600"
                onClick={() => setAddPackModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
              >
                Create Prompt Pack
              </button>
            </div>
          </form>
        </div>
      )}

      {liveCredentialsModalOpen && liveRunTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          data-testid="live-credentials-modal"
        >
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-blue-500/30 bg-slate-900 p-6 shadow-2xl"
            onSubmit={runLiveBenchmark}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-400">
                  Live Benchmark
                </p>
                <h2 className="mt-1 text-3xl font-bold">Enter Runtime API Keys</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  These credentials are used only for this {liveRunTarget.name} run and
                  are cleared immediately after submit, cancel, or completion.
                </p>
              </div>

              <button
                type="button"
                className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold transition hover:bg-slate-700"
                onClick={closeLiveCredentials}
              >
                Cancel
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
              <p className="font-semibold">Key requirements</p>
              <p className="mt-2 leading-relaxed text-slate-400">
                Provide at least one provider key to run a real test. Providers without
                keys are skipped and reported in the run logs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {liveCredentialFields.map((field) => (
                <label key={field.id} className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-300">
                    {field.label}
                    {field.optional && (
                      <span className="text-xs font-normal text-slate-500">Optional</span>
                    )}
                  </span>
                  <input
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                    name={field.id}
                    placeholder={field.placeholder}
                    type={field.id.toLowerCase().includes('key') ? 'password' : 'url'}
                    value={liveCredentials[field.id]}
                    onChange={(event) =>
                      setLiveCredentials((credentials) => ({
                        ...credentials,
                        [field.id]: event.target.value,
                      }))
                    }
                  />
                  <span className="mt-2 block text-xs leading-relaxed text-slate-500">
                    {field.provider}: {field.helper}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-600"
                onClick={closeLiveCredentials}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
              >
                Start Live Test
              </button>
            </div>
          </form>
        </div>
      )}

      {benchmarkModalOpen && runResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          data-testid="benchmark-modal"
        >
          <div className="w-full max-w-xl rounded-3xl border border-green-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wide text-green-400">
                Benchmark Queued
              </p>
              <h2 className="mt-1 text-3xl font-bold">Run New Benchmark</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Your full benchmark run has been queued across all models and metrics.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  {runResult.metricCount ? 'Benchmark' : 'Library'}
                </p>
                <p className="mt-1 text-xl font-bold">{runResult.libraryName}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Models</p>
                  <p className="mt-1 text-2xl font-bold">{runResult.modelCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">
                    {runResult.metricCount ? 'Metrics' : 'Prompts'}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {runResult.metricCount ?? runResult.promptCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">
                    {runResult.metricCount ? 'Checks' : 'Runtime'}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {runResult.metricCount ? runResult.promptCount : `${runResult.estimatedMinutes}m`}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
                onClick={() => setBenchmarkModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
