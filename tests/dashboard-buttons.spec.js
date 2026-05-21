import { expect, test } from '@playwright/test';

const libraryCard = (page, libraryName) => page.getByTestId(`library-card-${libraryName}`);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue to Dashboard' }).click();
});

test('loads the dashboard', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'AI Model Benchmark Lab' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run New Benchmark' })).toBeVisible();
});

test('shows a splash screen explaining benchmark access requirements', async ({ page }) => {
  await page.goto('/');

  const splash = page.getByTestId('splash-screen');
  await expect(splash).toBeVisible();
  await expect(splash.getByText('How real model testing works')).toBeVisible();
  await expect(splash.getByText('Mock Test')).toBeVisible();
  await expect(splash.getByText('Runtime keys required')).toBeVisible();
  await splash.getByRole('button', { name: 'Continue to Dashboard' }).click();
  await expect(splash).toBeHidden();
});

test('View Library opens the selected prompt library modal and Close hides it', async ({
  page,
}) => {
  await libraryCard(page, 'Research & Analysis')
    .getByRole('button', { name: 'View Library' })
    .click();

  const modal = page.getByTestId('library-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading', { name: 'Research & Analysis' })).toBeVisible();
  await expect(modal.getByText('Fact-check an AI-generated market analysis report.')).toBeVisible();

  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toBeHidden();
});

test('Run Tests queues the selected library and updates status details', async ({ page }) => {
  await libraryCard(page, 'Reasoning & Logic')
    .getByRole('button', { name: 'Run Tests' })
    .click();

  const status = page.getByTestId('test-run-status');
  await expect(status.getByText('Queued')).toBeVisible();
  await expect(status.getByText('Reasoning & Logic')).toBeVisible();
  await expect(status.getByText('5')).toBeVisible();
  await expect(status.getByText('31')).toBeVisible();
  await expect(status.getByText('4 minutes')).toBeVisible();

  const logs = page.getByTestId('benchmark-log-window');
  await expect(logs.getByText('Running')).toBeVisible();
  await expect(logs.getByText('Starting benchmark for Reasoning & Logic.')).toBeVisible();
  await expect(logs.getByText('Score Formula')).toBeVisible();
  await expect(logs.getByText('Previous Score')).toBeVisible();
  await expect(logs.getByText('Updated Score')).toBeVisible();
  await expect(page.getByTestId('score-calculation').getByText('83 + 3')).toBeVisible();
  await expect(logs.getByText('Loaded 31 prompts from Reasoning & Logic.')).toBeVisible();
  await expect(
    logs.getByText('Benchmark complete for Reasoning & Logic. Results are ready in Test Run Status.'),
  ).toBeVisible({ timeout: 5000 });
  await expect(logs.getByText('100%')).toBeVisible();
});

test('Run Tests With This Library queues tests from the library modal', async ({ page }) => {
  await libraryCard(page, 'Creative Writing')
    .getByRole('button', { name: 'View Library' })
    .click();

  const modal = page.getByTestId('library-modal');
  await modal.getByRole('button', { name: 'Run Tests With This Library' }).click();
  await expect(modal).toBeHidden();

  const status = page.getByTestId('test-run-status');
  await expect(status.getByText('Queued')).toBeVisible();
  await expect(status.getByText('Creative Writing')).toBeVisible();
  await expect(status.getByText('28')).toBeVisible();
});

test('Run New Benchmark scores every model across every metric', async ({ page }) => {
  await libraryCard(page, 'Agentic AI Tasks')
    .getByRole('button', { name: 'View Library' })
    .click();
  await page.getByTestId('library-modal').getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Run New Benchmark' }).click();

  const modal = page.getByTestId('benchmark-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('Benchmark Queued')).toBeVisible();
  await expect(modal.getByText('Full Model Benchmark')).toBeVisible();
  await expect(modal.getByText('Metrics', { exact: true })).toBeVisible();
  await expect(modal.getByText('Checks', { exact: true })).toBeVisible();

  const logs = page.getByTestId('benchmark-log-window');
  await expect(logs.getByText('Starting benchmark for Full Model Benchmark.')).toBeVisible();
  await expect(logs.getByText('Loaded 5 models and 4 scoring metrics.')).toBeVisible();
  await expect(
    logs.getByText(
      'Running 20 model-metric checks across coding, creativity, reasoning, and research.',
    ),
  ).toBeVisible();
  await expect(page.getByTestId('score-calculation').getByText('5 models x 4 metrics')).toBeVisible();
  const scoreCalculation = page.getByTestId('score-calculation');
  await expect(scoreCalculation.getByText('Metric Averages')).toBeVisible();
  await expect(scoreCalculation.getByText('coding', { exact: true })).toBeVisible();
  await expect(scoreCalculation.getByText('research', { exact: true })).toBeVisible();

  const status = page.getByTestId('test-run-status');
  await expect(status.getByText('Queued')).toBeVisible();
  await expect(status.getByText('Full Model Benchmark')).toBeVisible();
  await expect(status.getByText('20')).toBeVisible();
  await expect(
    logs.getByText('Benchmark complete for Full Model Benchmark. Results are ready in Test Run Status.'),
  ).toBeVisible({ timeout: 5000 });
  const latestTrendRow = page.locator('tbody tr').last();
  await expect(latestTrendRow.locator('td').first()).toContainText(
    /[A-Z][a-z]{2} \d{2}, \d{4}/,
  );
  await expect(page.getByTestId('trend-score-4-GPT')).toHaveClass(/text-green-400/);
  await expect(page.getByTestId('trend-score-4-Llama')).toHaveClass(/text-amber-300/);

  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toBeHidden();
});

test('Live Test collects runtime keys and displays mocked provider results', async ({
  page,
}) => {
  await page.route('**/api/benchmark/live', async (route) => {
    const requestBody = route.request().postDataJSON();

    expect(requestBody.credentials.openaiApiKey).toBe('sk-test-runtime-key');
    expect(requestBody.credentials.anthropicApiKey).toBe('');
    expect(requestBody.prompts.length).toBeGreaterThan(0);

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        summary: {
          targetName: 'Full Model Benchmark',
          promptCount: requestBody.prompts.length,
          providerCount: 1,
        },
        results: [
          {
            provider: 'openai',
            model: 'GPT',
            status: 'ok',
            latencyMs: 1250,
            score: 88,
            responseLength: 320,
            message: 'Response received.',
          },
        ],
        logs: [
          'Loaded 4 prompt(s) for Full Model Benchmark.',
          'Calling GPT.',
          'GPT returned 200 in 1250ms.',
          'Claude skipped: missing ANTHROPIC_API_KEY.',
        ],
        scoreDetails: {
          baselineScore: 0,
          updatedScore: 88,
          formula: 'round(avg(1 live provider score(s))) = 88',
        },
      }),
    });
  });

  await page.getByRole('button', { name: 'Live Test' }).click();
  await expect(page.getByTestId('live-mode-notice')).toContainText(
    'Runtime API keys required',
  );

  await page.getByRole('button', { name: 'Run New Benchmark' }).click();

  const modal = page.getByTestId('live-credentials-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('OPENAI_API_KEY')).toBeVisible();
  await expect(modal.getByText('ANTHROPIC_API_KEY')).toBeVisible();
  await modal.getByLabel('OPENAI_API_KEY').fill('sk-test-runtime-key');
  await modal.getByRole('button', { name: 'Start Live Test' }).click();

  const status = page.getByTestId('test-run-status');
  await expect(status.getByText('Live Complete')).toBeVisible();
  await expect(status.getByTestId('live-results').getByText('GPT')).toBeVisible();
  await expect(status.getByText('88/100 in 1250ms')).toBeVisible();

  const logs = page.getByTestId('benchmark-log-window');
  await expect(logs.getByText('Calling GPT.')).toBeVisible();
  await expect(logs.getByText('Claude skipped: missing ANTHROPIC_API_KEY.')).toBeVisible();
  await expect(page.getByTestId('score-calculation').getByText('88', { exact: true })).toBeVisible();
});

test('Add Prompt Pack creates a visible library that can be viewed and tested', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add Prompt Pack' }).click();

  const addModal = page.getByTestId('add-pack-modal');
  await expect(addModal).toBeVisible();
  await addModal.getByLabel('Pack Name').fill('Security Evaluation');
  await addModal.getByLabel('Prompt Count').fill('14');
  await addModal
    .getByLabel('Description')
    .fill('Security prompts for threat modeling and response quality.');
  await addModal
    .getByLabel('Sample Prompts')
    .fill('Analyze an incident response plan.\nIdentify gaps in a threat model.');
  await addModal.getByRole('button', { name: 'Create Prompt Pack' }).click();

  await expect(addModal).toBeHidden();
  const newCard = libraryCard(page, 'Security Evaluation');
  await expect(newCard).toBeVisible();
  await expect(newCard.getByText('14 Prompts')).toBeVisible();

  await newCard.getByRole('button', { name: 'View Library' }).click();
  const libraryModal = page.getByTestId('library-modal');
  await expect(libraryModal.getByRole('heading', { name: 'Security Evaluation' })).toBeVisible();
  await expect(libraryModal.getByText('Analyze an incident response plan.')).toBeVisible();
  await libraryModal.getByRole('button', { name: 'Run Tests With This Library' }).click();

  const status = page.getByTestId('test-run-status');
  await expect(status.getByText('Security Evaluation')).toBeVisible();
  await expect(status.getByText('14')).toBeVisible();
});
