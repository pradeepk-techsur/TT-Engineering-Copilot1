import { test, expect, request as playwrightRequest } from '@playwright/test';
import { requireData } from './helpers/storyline';

/**
 * Numeric Risk Score and Gate Review highlights.
 *
 * The storyline these run against: Gates 0–2 decided and clean, Gate 3 open
 * with one Major finding (F3-001) and one blocking action (A3-001) due at
 * Gate 4, Gates 4–9 locked.
 *
 * Gate 3 can only be decided once, so the suite clears any decision left by an
 * earlier run first. Without this the recording tests pass on a fresh server
 * and 409 on the second run — the kind of order dependence that makes a suite
 * untrustworthy. In a real database this endpoint refuses, as it should.
 */
test.beforeAll(async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext({ baseURL });
  await ctx.delete('/api/gates/preview-decisions');
  await ctx.dispose();
});

/**
 * Is the seeded demo storyline loaded?
 *
 * Everything above this line is an invariant of the code and must hold whatever
 * data is present. What follows depends on the specific storyline — Gate 3 open
 * with F3-001 and A3-001 — which is what Preview mode serves but a freshly
 * seeded database (currentPhase 0) does not. Tests that assert a particular
 * score, finding or outcome declare that dependency and skip rather than
 * pretending a different dataset is a failure.
 */
/** Shared with the other specs — see e2e/helpers/storyline.ts. */
async function requireStoryline(request: import('@playwright/test').APIRequestContext) {
  await requireData(request, 'gate3Storyline');
}

test.describe('Numeric Risk Score — API', () => {
  test('every phase and gate returns a 0–100 score with a level', async ({ request }) => {
    for (let phaseId = 0; phaseId <= 9; phaseId++) {
      const res = await request.get(`/api/risk/phase/${phaseId}`);
      expect(res.status(), `phase ${phaseId}`).toBe(200);
      const risk = await res.json();

      expect(risk.score).toBeGreaterThanOrEqual(0);
      expect(risk.score).toBeLessThanOrEqual(100);
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(risk.level);
      // Number AND word, never one without the other.
      expect(risk.display).toMatch(/^Risk: \d{1,3} \/ 100, (Low|Medium|High|Critical)$/);
      expect(risk.explanation.length).toBeGreaterThan(10);
    }
  });

  test('the score offers all four drill-down lists', async ({ request }) => {
    await requireStoryline(request);
    const risk = await (await request.get('/api/risk/phase/3')).json();
    for (const key of ['contributingFindings', 'openActions', 'failedChecks', 'missingEvidence']) {
      expect(risk.drillDown, key).toHaveProperty(key);
      expect(Array.isArray(risk.drillDown[key])).toBe(true);
    }
    // Gate 3's score is one Major finding plus one open blocking action.
    expect(risk.score).toBe(45);
    expect(risk.level).toBe('Medium');
    expect(risk.drillDown.contributingFindings[0].id).toBe('F3-001');
    expect(risk.drillDown.openActions[0].id).toBe('A3-001');
  });

  test('the scoring rules are configurable and published', async ({ request }) => {
    const config = await (await request.get('/api/risk/config')).json();
    expect(config.cap).toBe(100);
    expect(config.weights.minorUnresolvedFinding).toBe(10);
    expect(config.weights.majorUnresolvedFinding).toBe(25);
    expect(config.weights.criticalUnresolvedFinding).toBe(40);
    expect(config.weights.failedMandatoryCheck).toBe(20);
    expect(config.weights.missingMandatoryEvidence).toBe(20);
    expect(config.weights.openBlockingAction).toBe(20);
    expect(config.weights.overdueAction).toBe(10);
    expect(config.weights.unclosedPriorGateAction).toBe(15);
    expect(config.bands).toEqual([
      { level: 'Low', min: 0, max: 29 },
      { level: 'Medium', min: 30, max: 59 },
      { level: 'High', min: 60, max: 79 },
      { level: 'Critical', min: 80, max: 100 },
    ]);
    expect(config.calculatedBy).toContain('never the LLM');
  });

  test('lifecycle risk covers all ten phases', async ({ request }) => {
    const data = await (await request.get('/api/risk/lifecycle')).json();
    expect(data.phases).toHaveLength(10);
    for (let i = 0; i <= 9; i++) {
      const phase = data.byPhase[String(i)];
      expect(phase.phaseId).toBe(i);
      // Every phase reports whether it has started, which is what the
      // lifecycle view uses to decide where to put an indicator.
      expect(typeof phase.phaseStarted).toBe('boolean');
      expect(phase.score).toBeGreaterThanOrEqual(0);
      expect(phase.score).toBeLessThanOrEqual(100);
    }
    // The last phase cannot have started before the first.
    expect(data.byPhase['9'].phaseStarted).toBe(false);
  });

  test('the seeded storyline has Phase 3 active and Phase 9 not started', async ({ request }) => {
    await requireStoryline(request);
    const data = await (await request.get('/api/risk/lifecycle')).json();
    expect(data.byPhase['3'].phaseStarted).toBe(true);
    expect(data.byPhase['3'].score).toBe(45);
    expect(data.byPhase['9'].phaseStarted).toBe(false);
  });
});

test.describe('Gate advisory — API', () => {
  test('every gate returns a header, a risk score and an advisory', async ({ request }) => {
    for (let gateId = 0; gateId <= 9; gateId++) {
      const res = await request.get(`/api/gates/${gateId}/advisory`);
      expect(res.status(), `gate ${gateId}`).toBe(200);
      const { header, riskScore, advisory } = await res.json();

      expect(header.gateNumber).toBe(gateId);
      expect(header.phaseName).toContain(`Phase ${gateId}`);
      expect(typeof header.openFindings).toBe('number');
      expect(typeof header.blockingActions).toBe('number');
      expect(header.requiredHumanDecision).toContain('Pass');

      expect(riskScore.display).toMatch(/^Risk: \d{1,3} \/ 100, /);

      expect(['Pass', 'Conditional Pass', 'Fail']).toContain(advisory.recommendedOutcome);
      expect(advisory.advisoryLabel).toBe('Advisory Only — Human Decision Required');

      // Never more than three of anything.
      expect(advisory.keyStrengths.length, `gate ${gateId} strengths`).toBeLessThanOrEqual(3);
      expect(advisory.keyRisks.length, `gate ${gateId} risks`).toBeLessThanOrEqual(3);
      expect(advisory.nextSteps.length, `gate ${gateId} steps`).toBeLessThanOrEqual(3);

      // Two or three sentences.
      const sentences = advisory.rationale.match(/[^.!?]+[.!?]+/g) ?? [];
      expect(sentences.length, `gate ${gateId}: ${advisory.rationale}`).toBeGreaterThanOrEqual(1);
      expect(sentences.length, `gate ${gateId}: ${advisory.rationale}`).toBeLessThanOrEqual(3);

      // The recommendation always sits inside what the configured rules allow.
      expect(advisory.allowedOutcomes).toContain(advisory.recommendedOutcome);
    }
  });

  test('every strength, risk and next step links to supporting information', async ({ request }) => {
    for (let gateId = 0; gateId <= 9; gateId++) {
      const { advisory } = await (await request.get(`/api/gates/${gateId}/advisory`)).json();

      for (const s of advisory.keyStrengths) {
        expect(s.evidence.id, `gate ${gateId}`).toBeTruthy();
        expect(s.evidence.href, `gate ${gateId}: ${s.statement}`).toBeTruthy();
      }
      for (const r of advisory.keyRisks) {
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(r.level);
        expect(typeof r.blocking).toBe('boolean');
        expect(r.detail.href, `gate ${gateId}: ${r.statement}`).toBeTruthy();
      }
      for (const n of advisory.nextSteps) {
        expect(n.source.id, `gate ${gateId}: ${n.statement}`).toBeTruthy();
        expect(n.source.href, `gate ${gateId}: ${n.statement}`).toBeTruthy();
      }
    }
  });

  test('Gate 3 reads as the storyline expects', async ({ request }) => {
    await requireStoryline(request);
    const { header, riskScore, advisory } =
      await (await request.get('/api/gates/3/advisory')).json();

    expect(advisory.recommendedOutcome).toBe('Conditional Pass');
    expect(riskScore.score).toBe(45);
    expect(header.openFindings).toBe(1);

    // One key risk: the coolant connector, High, and not blocking THIS gate
    // because its action is due at Gate 4.
    expect(advisory.keyRisks).toHaveLength(1);
    expect(advisory.keyRisks[0].statement).toContain('Coolant connector');
    expect(advisory.keyRisks[0].level).toBe('High');
    expect(advisory.keyRisks[0].blocking).toBe(false);
    expect(advisory.keyRisks[0].detail.ownerRole).toBe('Design Engineer');
    expect(advisory.keyRisks[0].detail.dueGate).toBe(4);
  });

  test('a locked gate offers no recommendation', async ({ request }) => {
    const { advisory } = await (await request.get('/api/gates/8/advisory')).json();
    expect(advisory.recommendationAvailable).toBe(false);
    expect(advisory.rationale).toContain('locked');
  });

  test('an out-of-range gate is rejected', async ({ request }) => {
    expect((await request.get('/api/gates/42/advisory')).status()).toBe(400);
  });
});

test.describe('Risk Score display — Gate Review header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-review-header')).toBeVisible({ timeout: 15000 });
  });

  test('the header carries all five facts', async ({ page }) => {
    await requireStoryline(page.request);
    const header = page.getByTestId('gate-review-header');
    await expect(header).toContainText('Gate 3');
    await expect(header).toContainText('Preliminary Design');
    await expect(header).toContainText('AI recommendation');
    await expect(header).toContainText('Conditional Pass');
    await expect(header).toContainText('Overall risk score');
    await expect(header.getByTestId('gate-risk-score')).toContainText('Risk: 45 / 100');
    await expect(header.getByTestId('gate-risk-score')).toContainText('Medium');
    await expect(header.getByTestId('header-open-findings')).toHaveText('1');
    await expect(header.getByTestId('header-blocking-actions')).toBeVisible();
    await expect(header.getByTestId('header-required-decision'))
      .toContainText('Pass · Conditional Pass · Fail');
  });

  test('the score is never colour alone — the level is spelled out', async ({ page }) => {
    await requireStoryline(page.request);
    const chip = page.getByTestId('gate-risk-score');
    await expect(chip).toContainText('45');
    await expect(chip).toContainText('Medium');
    // And it is announced to assistive tech as a number plus a level.
    await expect(chip).toHaveAttribute('aria-label', /45 out of 100, Medium/);
  });

  test('selecting the score opens the four drill-down lists', async ({ page }) => {
    await requireStoryline(page.request);
    await page.getByTestId('gate-risk-score').click();
    const dialog = page.getByTestId('risk-score-detail');
    await expect(dialog).toBeVisible();

    await expect(dialog).toContainText('Main contributing findings');
    await expect(dialog).toContainText('Open actions');
    await expect(dialog).toContainText('Failed checks');
    await expect(dialog).toContainText('Missing evidence');
    await expect(dialog).toContainText('F3-001');
    await expect(dialog).toContainText('A3-001');
  });

  test('the weighting breakdown is available but not shown by default', async ({ page }) => {
    await requireStoryline(page.request);
    await page.getByTestId('gate-risk-score').click();
    const dialog = page.getByTestId('risk-score-detail');
    await expect(dialog).toBeVisible();

    // Collapsed: the summary is there, the table is not.
    await expect(dialog.getByText('How this score is calculated')).toBeVisible();
    await expect(dialog.getByRole('table')).toBeHidden();

    await dialog.getByText('How this score is calculated').click();
    await expect(dialog.getByRole('table')).toBeVisible();
    await expect(dialog.getByRole('table')).toContainText('+25');
    await expect(dialog.getByRole('table')).toContainText('45 / 100');
  });
});

test.describe('Risk Score display — Phase Workspace and Lifecycle', () => {
  test('the phase workspace header shows the score', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/phase/3');
    const chip = page.getByTestId('phase-risk-score');
    await expect(chip).toBeVisible({ timeout: 15000 });
    await expect(chip).toContainText('Risk: 45 / 100');
    await expect(chip).toContainText('Medium');
  });

  test('the lifecycle view shows one indicator per active or completed phase', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/lifecycle');
    await expect(page.getByTestId('phase-3')).toBeVisible({ timeout: 15000 });

    // Decided and current phases carry a score.
    for (const phaseId of [0, 1, 2, 3]) {
      const chip = page.getByTestId(`phase-risk-${phaseId}`);
      await expect(chip, `phase ${phaseId}`).toBeVisible({ timeout: 15000 });
      await expect(chip).toContainText('Risk:');
    }
    await expect(page.getByTestId('phase-risk-3')).toContainText('45 / 100');

    // Phases that have not started say so instead.
    for (const phaseId of [4, 9]) {
      await expect(page.getByTestId(`phase-risk-none-${phaseId}`)).toContainText('Not started');
    }
  });

  test('the lifecycle indicator opens the same drill-down', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/lifecycle');
    await expect(page.getByTestId('phase-risk-3')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('phase-risk-3').click();
    await expect(page.getByTestId('risk-score-detail')).toContainText('Phase 3 — Overall Risk Score');
  });
});

test.describe('Gate Review advisory panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-advisory-panel')).toBeVisible({ timeout: 15000 });
  });

  test('shows recommendation, risk, why, strengths, risks and next steps', async ({ page }) => {
    const panel = page.getByTestId('gate-advisory-panel');
    await expect(panel).toContainText('AI recommendation');
    await expect(panel).toContainText('Risk');
    await expect(panel).toContainText('Why this recommendation');
    await expect(panel).toContainText('Key strengths');
    await expect(panel).toContainText('Key risks');
    await expect(panel).toContainText('Next steps');

    // The advisory label can never be suppressed.
    await expect(panel.getByTestId('advisory-label')).toContainText('Advisory Only');
    await expect(panel.getByTestId('advisory-label')).toContainText('Human Decision Required');
  });

  test('the rationale is two or three sentences', async ({ page }) => {
    const text = await page.getByTestId('advisory-rationale').innerText();
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
  });

  test('no more than three strengths, risks or next steps are displayed', async ({ page }) => {
    expect(await page.getByTestId('advisory-strength-item').count()).toBeLessThanOrEqual(3);
    expect(await page.getByTestId('advisory-risk-item').count()).toBeLessThanOrEqual(3);
    expect(await page.getByTestId('advisory-next-step-item').count()).toBeLessThanOrEqual(3);
  });

  test('each key risk shows its level and blocking status', async ({ page }) => {
    await requireStoryline(page.request);
    const risk = page.getByTestId('advisory-risk-item').first();
    await expect(risk).toContainText('High');
    await expect(risk).toContainText('Non-blocking');
    await expect(risk).toContainText('F3-001');
  });

  test('selecting a key risk opens the full finding and its action', async ({ page }) => {
    await requireStoryline(page.request);
    await page.getByTestId('advisory-risk-item').first().getByRole('button').click();
    const detail = page.getByTestId('key-risk-detail-0');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Full finding');
    await expect(detail).toContainText('Supporting evidence');
    await expect(detail).toContainText('Recommended action');
    await expect(detail).toContainText('Owner role');
    await expect(detail).toContainText('Design Engineer');
    await expect(detail).toContainText('Due phase or gate');
    await expect(detail).toContainText('Gate 4');
  });

  test('says who wrote the score and who wrote the prose', async ({ page }) => {
    await expect(page.getByTestId('advisory-provenance'))
      .toContainText('calculated by the application from configured structured rules');
    await expect(page.getByTestId('advisory-provenance')).toContainText('never by the model');
  });

  test('no output-document content is dumped into the screen', async ({ page }) => {
    const body = (await page.textContent('body')) ?? '';
    expect(body).not.toContain('Connected to ');
    expect(body).not.toContain('replacement input');

    // A generated output carries the synthetic disclaimer inside its own file;
    // finding that text on this screen would mean an artifact had been inlined.
    expect(body).not.toContain('Not for Design, Fabrication, Certification');

    // Every drill-down is behind a control, not expanded into the page: no
    // dialog content is present until something is selected.
    await expect(page.getByTestId('risk-score-detail')).toHaveCount(0);
    await expect(page.getByTestId('key-risk-detail-0')).toHaveCount(0);
  });
});

test.describe('Human gate decision keeps its authority', () => {
  test('AI recommendation and human decision are visibly distinct', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 15000 });

    const aiVsHuman = page.getByTestId('ai-vs-human');
    await expect(aiVsHuman).toContainText('AI recommendation');
    await expect(aiVsHuman).toContainText('Conditional Pass');
    await expect(aiVsHuman).toContainText('Advisory only');

    // The human controls are their own thing, with nothing pre-selected.
    await expect(page.getByTestId('gate-decision-selector')).toContainText('Human decision');
    const checked = page.getByTestId('gate-outcome-radio')
      .locator('[data-slot="radio-group-item"][data-checked]');
    await expect(checked).toHaveCount(0);
    await expect(page.getByTestId('record-decision-button')).toBeDisabled();
  });

  test('all three outcomes are offered to the reviewer', async ({ page }) => {
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 15000 });
    for (const outcome of ['Pass', 'Conditional Pass', 'Fail']) {
      // Exact: "Pass" would otherwise also match "Conditional Pass".
      await expect(page.getByRole('radio', { name: outcome, exact: true })).toBeVisible();
    }
  });

  test('a decision that differs from the AI requires a rationale', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('reviewer-role-input').fill('Engineering Lead');

    // Fail differs from the advisory Conditional Pass.
    await page.getByRole('radio', { name: 'Fail', exact: true }).click();
    await expect(page.getByTestId('divergence-rationale-block')).toBeVisible();
    await expect(page.getByTestId('divergence-rationale-block'))
      .toContainText('differs from the AI recommendation');
    await expect(page.getByTestId('record-decision-button')).toBeDisabled();

    // With a reason, it goes through.
    await page.getByTestId('human-rationale-input')
      .fill('Coolant interface is frozen, so this cannot be deferred to Gate 4.');
    await expect(page.getByTestId('record-decision-button')).toBeEnabled();
  });

  test('agreeing with the AI needs no extra rationale', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('reviewer-role-input').fill('Engineering Lead');
    await page.getByRole('radio', { name: 'Conditional Pass', exact: true }).click();
    await expect(page.getByTestId('divergence-rationale-block')).toBeHidden();
    await expect(page.getByTestId('record-decision-button')).toBeEnabled();
  });

  test('the confirmation names both the AI recommendation and the human decision', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/gate/3/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('reviewer-role-input').fill('Engineering Lead');
    await page.getByRole('radio', { name: 'Conditional Pass', exact: true }).click();
    await page.getByTestId('record-decision-button').click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('AI recommendation:');
    await expect(dialog).toContainText('Your decision:');
    await expect(dialog).toContainText('Engineering Lead');
    await page.getByText('Cancel').click();
  });
});

test.describe('Safeguards — the AI cannot decide, and the score cannot approve', () => {
  test('an AI actor is refused', async ({ request }) => {
    const res = await request.post('/api/gates/3/decide', {
      headers: { 'X-Reviewer-Role': 'Claude' },
      data: { decision: 'Pass' },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error_code).toBe('GATE_AI_PROHIBITED');
  });

  test('an outcome outside the three is refused', async ({ request }) => {
    const res = await request.post('/api/gates/3/decide', {
      headers: { 'X-Reviewer-Role': 'Engineering Lead' },
      data: { decision: 'Approve' },
    });
    expect(res.status()).toBe(400);
  });

  test('a divergent decision with no rationale is refused server-side too', async ({ request }) => {
    await requireStoryline(request);
    const res = await request.post('/api/gates/3/decide', {
      headers: { 'X-Reviewer-Role': 'Engineering Lead' },
      data: { decision: 'Fail', comments: 'no reason' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error_code).toBe('HUMAN_RATIONALE_REQUIRED');
  });

  test('the risk score never decides anything on its own', async ({ request }) => {
    // Reading the score and the advisory must not move a gate, whatever the
    // score turns out to be — a Critical score does not close a gate and a Low
    // one does not open it. Compare the gate state either side of the read.
    const before = await (await request.get('/api/gates/3/review')).json();

    const { riskScore, advisory } = await (await request.get('/api/gates/3/advisory?force=1')).json();
    expect(advisory.advisoryLabel).toBe('Advisory Only — Human Decision Required');
    expect(riskScore.score).toBeGreaterThanOrEqual(0);

    const after = await (await request.get('/api/gates/3/review')).json();
    expect(after.gateState).toBe(before.gateState);
    expect(after.phaseState).toBe(before.phaseState);
  });
});

test.describe('Preserved decision record', () => {
  test('records both halves, and flags the override', async ({ request }) => {
    await requireStoryline(request);
    // Gate 3 is the only gate open in this storyline, and it can be decided once.
    const post = await request.post('/api/gates/3/decide', {
      headers: { 'X-Reviewer-Role': 'Engineering Lead' },
      data: {
        decision: 'Fail',
        comments: 'Reviewed with the customer.',
        humanRationale: 'Coolant interface is frozen; CN-COOL-1 cannot move in Phase 4.',
      },
    });

    // Either the decision lands, or the gate has already been decided in this
    // run — both are correct, and neither may be a silent failure.
    if (post.status() === 409) {
      test.info().annotations.push({ type: 'note', description: 'Gate 3 already decided in this run' });
    } else {
      expect(post.status()).toBe(200);
      const body = await post.json();
      expect(body.aiRecommendation).toBe('Conditional Pass');
      expect(body.divergedFromAi).toBe(true);
      expect(body.riskScore.score).toBe(45);
    }

    const { decisionRecords } = await (await request.get('/api/gates/3/advisory')).json();
    expect(decisionRecords.length).toBeGreaterThan(0);

    const record = decisionRecords[decisionRecords.length - 1];
    expect(record.decision).toBe('Fail');
    expect(record.reviewerRole).toBe('Engineering Lead');
    expect(record.humanRationale).toContain('Coolant interface');
    expect(record.divergedFromAi).toBe(true);
    expect(record.timestamp).toBeTruthy();

    // The AI half is frozen alongside it.
    expect(record.aiRecommendation.recommendedOutcome).toBe('Conditional Pass');
    expect(record.aiRecommendation.rationale).toBeTruthy();
    expect(record.aiRecommendation.keyStrengths.length).toBeGreaterThan(0);
    expect(record.aiRecommendation.keyRisks.length).toBeGreaterThan(0);
    expect(record.aiRecommendation.nextSteps.length).toBeGreaterThan(0);
    expect(record.riskScore.score).toBe(45);
    expect(record.riskScore.level).toBe('Medium');
  });

  test('the audit history keeps the AI recommendation next to the human decision', async ({ request }) => {
    await requireStoryline(request);
    const { events } = await (await request.get('/api/audit?eventType=GateDecision')).json();
    const gate3 = events.find((e: { phaseId: number }) => e.phaseId === 3);
    expect(gate3, 'no Gate 3 decision in the audit log').toBeTruthy();

    expect(gate3.description).toContain('Fail');
    expect(gate3.description).toContain('AI recommended Conditional Pass');
    expect(gate3.description).toContain('human overrode');
    expect(gate3.gateDecision.aiRecommendation).toBe('Conditional Pass');
    expect(gate3.gateDecision.decision).toBe('Fail');
    expect(gate3.gateDecision.divergedFromAi).toBe(true);
    expect(gate3.gateDecision.riskScore).toBe(45);
    expect(gate3.gateDecision.humanRationale).toContain('Coolant interface');
  });

  test('the same gate cannot be decided twice', async ({ request }) => {
    await requireStoryline(request);
    const res = await request.post('/api/gates/3/decide', {
      headers: { 'X-Reviewer-Role': 'Program Manager' },
      data: { decision: 'Pass' },
    });
    expect(res.status()).toBe(409);
  });

  test('the record is shown on the gate review screen', async ({ page }) => {
    await requireStoryline(page.request);
    await page.goto('/gate/3/review');
    const records = page.getByTestId('gate-decision-records');
    await expect(records).toBeVisible({ timeout: 15000 });
    await expect(records).toContainText('AI recommendation');
    await expect(records).toContainText('Human decision');
    await expect(records).toContainText('Differs from AI recommendation');
    await expect(records.getByTestId('human-rationale')).toContainText('Coolant interface');
  });
});

test.describe('No new artifacts are created', () => {
  test('the enhancement adds no input or output to any phase', async ({ request }) => {
    for (let phaseId = 0; phaseId <= 9; phaseId++) {
      const review = await (await request.get(`/api/gates/${phaseId}/review`)).json();
      // Two inputs and at most two outputs, exactly as configured before.
      expect(review.inputs.length, `phase ${phaseId} inputs`).toBeLessThanOrEqual(2);
      expect(review.outputs.length, `phase ${phaseId} outputs`).toBeLessThanOrEqual(2);
    }
  });

  test('the advisory endpoint is read-only — calling it twice changes nothing', async ({ request }) => {
    const first = await (await request.get('/api/gates/3/advisory?force=1')).json();
    const second = await (await request.get('/api/gates/3/advisory?force=1')).json();
    expect(second.riskScore.score).toBe(first.riskScore.score);
    expect(second.advisory.recommendedOutcome).toBe(first.advisory.recommendedOutcome);
    expect(second.decisionRecords.length).toBe(first.decisionRecords.length);
  });
});
