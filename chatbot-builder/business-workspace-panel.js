import {
  createBusiness,
  saveBusinessSource,
  extractBusinessSource,
  saveBusinessAnswer,
  recalculateBusinessCoverage,
} from './business-api.js';

const root = document.querySelector('#businessWorkspace');
if (!root) throw new Error('BotCraft business workspace mount is missing.');

const state = { business: null, source: null, coverage: null, busy: false };
root.innerHTML = `
  <section class="business-workspace-card" aria-labelledby="businessWorkspaceTitle">
    <div class="business-workspace-heading">
      <div><p class="business-eyebrow">BUSINESS KNOWLEDGE</p><h2 id="businessWorkspaceTitle">Set up your business profile</h2>
      <p class="business-description">Save the real business details that your chatbot should rely on. Your information is sent only to the configured, authenticated BotCraft Worker.</p></div>
      <span class="business-workspace-step" id="businessStep">Step 1 of 3</span>
    </div>
    <div class="business-status" id="businessStatus" role="status" aria-live="polite">Secure sign-in and Worker configuration are required.</div>
    <form id="businessCreateForm" class="business-form">
      <label>Business name<input name="businessName" maxlength="160" required placeholder="e.g. Sri Lakshmi Tiffins"></label>
      <label>Business category<select name="category" required>
        <option value="">Choose your business type</option>
        <option value="restaurant">Restaurant / food</option><option value="hotel">Hotel / accommodation</option>
        <option value="retail">Retail / local shop</option><option value="ecommerce">E-commerce</option>
        <option value="salon">Salon / beauty</option><option value="education">Education / coaching</option>
        <option value="healthcare">Healthcare / clinic</option><option value="real_estate">Real estate</option>
        <option value="travel">Travel / tourism</option><option value="professional_services">Professional services</option>
        <option value="home_services">Local / home services</option><option value="fitness">Fitness / wellness</option>
        <option value="automotive">Automotive</option><option value="events">Events / venues</option>
        <option value="pet_services">Pet services</option><option value="general">General business</option>
      </select></label>
      <label>Website URL <span class="business-optional">(optional)</span><input name="websiteOrigin" type="url" placeholder="https://example.com"></label>
      <label>Chat language<select name="preferredLanguage"><option value="auto">Use the owner's language</option><option value="en">English</option><option value="te">Telugu</option><option value="hi">Hindi</option></select></label>
      <button class="business-primary" type="submit">Create secure workspace</button>
    </form>
    <form id="businessSourceForm" class="business-form" hidden>
      <label>Business information source<textarea name="sourceText" rows="6" maxlength="500000" required placeholder="Paste your menu, services, prices, timings, address, delivery and refund policy, FAQs, etc."></textarea></label>
      <label>Source name <span class="business-optional">(optional)</span><input name="sourceName" maxlength="255" placeholder="e.g. Official menu and opening hours"></label>
      <p class="business-help">Only facts supported by this source will be extracted. Conflicting or unverified information must be reviewed by you.</p>
      <button class="business-primary" type="submit">Save source and extract facts</button>
    </form>
    <section id="businessCoverage" class="business-coverage" hidden aria-labelledby="coverageTitle">
      <h3 id="coverageTitle">Knowledge coverage</h3>
      <div class="business-metrics" id="businessMetrics"></div>
      <p id="businessCoverageNote" class="business-help"></p>
      <div class="owner-question" id="ownerQuestion" hidden>
        <p class="business-eyebrow">NEXT OWNER QUESTION</p><h4 id="ownerQuestionPrompt"></h4>
        <p id="ownerQuestionReason" class="business-help"></p>
        <form id="ownerAnswerForm" class="business-form">
          <label>Your confirmed answer<textarea name="answer" rows="3" maxlength="12000" placeholder="Enter the correct business information"></textarea></label>
          <label class="business-checkbox"><input type="checkbox" name="notApplicable"> This does not apply to my business</label>
          <button class="business-primary" type="submit">Save answer and continue</button>
        </form>
      </div>
    </section>
  </section>`;

const createForm = root.querySelector('#businessCreateForm');
const sourceForm = root.querySelector('#businessSourceForm');
const status = root.querySelector('#businessStatus');
const submitButtons = () => [...root.querySelectorAll('button[type="submit"]')];

function setBusy(value) {
  state.busy = value;
  for (const button of submitButtons()) button.disabled = value;
  root.setAttribute('aria-busy', String(value));
}
function report(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}
function formatMetric(label, value) {
  const item = document.createElement('div');
  item.className = 'business-metric';
  const number = document.createElement('strong');
  number.textContent = String(value);
  const caption = document.createElement('span');
  caption.textContent = label;
  item.append(number, caption);
  return item;
}
function showCoverage(coverage) {
  state.coverage = coverage;
  const section = root.querySelector('#businessCoverage');
  section.hidden = false;
  root.querySelector('#businessStep').textContent = 'Step 3 of 3';
  const metrics = root.querySelector('#businessMetrics');
  metrics.replaceChildren(
    formatMetric('Questions assessed', coverage.total ?? 0),
    formatMetric('Answerable', coverage.answerable ?? 0),
    formatMetric('Missing required', coverage.missingMandatory ?? 0),
    formatMetric('Needs review', coverage.needsReview ?? 0),
  );
  const ready = Boolean(coverage.launchReady);
  root.querySelector('#businessCoverageNote').textContent = ready
    ? 'Required coverage looks complete. Review the facts and run the final chatbot tests before publishing.'
    : 'This business is not launch-ready yet. Answer the next question and resolve any conflicts or unverified facts.';
  const question = coverage.nextOwnerQuestion;
  const questionBox = root.querySelector('#ownerQuestion');
  questionBox.hidden = !question;
  if (question) {
    root.querySelector('#ownerQuestionPrompt').textContent = question.prompt || 'Please confirm this business detail.';
    root.querySelector('#ownerQuestionReason').textContent = question.reason || '';
    const form = root.querySelector('#ownerAnswerForm');
    form.dataset.questionId = question.questionId || '';
    form.dataset.knowledgeKey = question.knowledgeKey || '';
    const answer = form.elements.answer;
    const notApplicable = form.elements.notApplicable;
    answer.value = '';
    answer.disabled = !question.knowledgeKey;
    notApplicable.checked = false;
    notApplicable.disabled = !question.knowledgeKey || question.canMarkNotApplicable === false;
    form.querySelector('button[type="submit"]').disabled = !question.knowledgeKey;
    if (!question.knowledgeKey) {
      root.querySelector('#ownerQuestionReason').textContent += ' The server has not supplied a storage key for this question, so saving is disabled rather than guessing.';
    }
  }
}
async function refreshCoverage() {
  const result = await recalculateBusinessCoverage(state.business.businessId);
  showCoverage(result.coverage);
}

createForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (state.busy || state.business) return;
  const data = new FormData(createForm);
  setBusy(true);
  report('Creating your secure business workspace…');
  try {
    const result = await createBusiness({
      businessName: String(data.get('businessName') || ''),
      category: String(data.get('category') || ''),
      websiteOrigin: String(data.get('websiteOrigin') || '').trim() || undefined,
      preferredLanguage: String(data.get('preferredLanguage') || 'auto'),
    });
    state.business = result.business;
    createForm.hidden = true;
    sourceForm.hidden = false;
    root.querySelector('#businessStep').textContent = 'Step 2 of 3';
    report('Business workspace created. Next, add an official source such as your menu, service list or FAQ.');
  } catch (error) {
    report(error instanceof Error ? error.message : 'Could not create the business workspace.', true);
  } finally { setBusy(false); }
});

sourceForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (state.busy || !state.business) return;
  const data = new FormData(sourceForm);
  setBusy(true);
  report('Saving your source and extracting evidence-backed facts…');
  try {
    if (!state.source) {
      const saved = await saveBusinessSource(state.business.businessId, {
        text: String(data.get('sourceText') || ''),
        name: String(data.get('sourceName') || '').trim() || undefined,
      });
      state.source = saved.source;
    }
    const extraction = await extractBusinessSource(state.business.businessId, state.source.sourceId);
    sourceForm.hidden = true;
    const result = extraction.coverage || (await recalculateBusinessCoverage(state.business.businessId)).coverage;
    showCoverage(result);
    const summary = extraction.extraction || {};
    report(`Source saved. Extracted ${summary.totalFacts ?? 0} facts; ${summary.evidenceNeedsReview ?? 0} need evidence review; ${summary.conflictingFacts ?? 0} are conflicting.`);
  } catch (error) {
    report(error instanceof Error ? error.message : 'Could not process this source. You can retry safely.', true);
    if (state.source) sourceForm.querySelector('button[type="submit"]').textContent = 'Retry extraction';
  } finally { setBusy(false); }
});

root.querySelector('#ownerAnswerForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.busy || !state.business) return;
  const form = event.currentTarget;
  const data = new FormData(form);
  const notApplicable = data.get('notApplicable') === 'on';
  const answer = String(data.get('answer') || '').trim();
  if (!notApplicable && !answer) {
    report('Enter an answer or mark this question as not applicable.', true);
    return;
  }
  setBusy(true);
  report('Saving your confirmed answer and recalculating coverage…');
  try {
    await saveBusinessAnswer(state.business.businessId, {
      questionId: form.dataset.questionId,
      knowledgeKey: form.dataset.knowledgeKey,
      ...(notApplicable ? { notApplicable: true } : { answer }),
    });
    await refreshCoverage();
    report('Answer saved. The next highest-priority business question is ready.');
  } catch (error) {
    report(error instanceof Error ? error.message : 'Could not save that answer.', true);
  } finally { setBusy(false); }
});
