const authTokenStorageKey = 'fairlens-auth-token';
const authEmailStorageKey = 'fairlens-auth-email';
const csvSensitiveHints = ['gender', 'sex', 'caste', 'religion', 'age', 'disability', 'region', 'state', 'language'];

const logoutBtn = document.getElementById('logoutBtn');
const tryAuditForm = document.getElementById('tryAuditForm');
const modelFileInput = document.getElementById('modelFile');
const datasetFileInput = document.getElementById('datasetFile');
const sensitiveColsSelect = document.getElementById('sensitiveCols');
const fairnessThreshold = document.getElementById('fairnessThreshold');
const thresholdValue = document.getElementById('thresholdValue');
const auditStatus = document.getElementById('auditStatus');
const auditResults = document.getElementById('auditResults');
const dpValue = document.getElementById('dpValue');
const eoValue = document.getElementById('eoValue');
const eopValue = document.getElementById('eopValue');
const biasFlagsList = document.getElementById('biasFlagsList');
const explanationText = document.getElementById('explanationText');
const accuracyBeforeValue = document.getElementById('accuracyBeforeValue');
const accuracyAfterValue = document.getElementById('accuracyAfterValue');
const improvementValue = document.getElementById('improvementValue');
const reportPathText = document.getElementById('reportPathText');
const useDemoPresetBtn = document.getElementById('useDemoPresetBtn');
const apiConnectionStatus = document.getElementById('apiConnectionStatus');
const runAuditBtn = document.getElementById('runAuditBtn');
const auditLoadingSpinner = document.getElementById('auditLoadingSpinner');
const auditLoadingText = document.getElementById('auditLoadingText');
const explainLoadingSpinner = document.getElementById('explainLoadingSpinner');
const fileValidationError = document.getElementById('fileValidationError');
const topBiasFindings = document.getElementById('topBiasFindings');
const findingsGrid = document.getElementById('findingsGrid');
const fairnessScoreBefore = document.getElementById('fairnessScoreBefore');
const fairnessScoreAfter = document.getElementById('fairnessScoreAfter');
const meterBefore = document.getElementById('meterBefore');
const meterAfter = document.getElementById('meterAfter');
const correctionSuggestions = document.getElementById('correctionSuggestions');
const suggestionPlaceholder = document.getElementById('suggestionPlaceholder');
const exportActions = document.getElementById('exportActions');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportNote = document.getElementById('exportNote');

let currentAuditData = null;
let apiHealthLastCheckedAt = 0;

const readStoredAuthToken = () => {
  try {
    const value = localStorage.getItem(authTokenStorageKey);
    return value && value.trim().length ? value.trim() : null;
  } catch {
    return null;
  }
};

const hasAuthToken = () => Boolean(readStoredAuthToken());

const buildApiHeaders = (baseHeaders = {}) => {
  const headers = { ...baseHeaders };
  const token = readStoredAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const formatMetric = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(3) : '-');
const formatPercent = (value) => (typeof value === 'number' && !Number.isNaN(value) ? `${value.toFixed(1)}%` : '-');

const setAuditStatus = (message, tone = 'normal') => {
  if (!auditStatus) return;
  auditStatus.textContent = message;
  auditStatus.style.color = tone === 'error' ? '#ffd0d0' : tone === 'success' ? '#7ff0b3' : '';
};

const setRunAuditLoading = (loading) => {
  if (!runAuditBtn) return;
  runAuditBtn.disabled = loading;
  runAuditBtn.textContent = loading ? 'Running audit...' : 'Run Full Audit';
};

const parseCsvHeader = (line) => {
  const headers = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      headers.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }

  if (current) headers.push(current.trim());
  return headers.filter(Boolean);
};

const validateFiles = (modelFile, datasetFile) => {
  const maxFileSize = 10 * 1024 * 1024;

  if (modelFile.size > maxFileSize) {
    return `Model file is too large (${(modelFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`;
  }
  if (datasetFile.size > maxFileSize) {
    return `Dataset file is too large (${(datasetFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`;
  }
  if (!modelFile.name.endsWith('.pkl')) {
    return 'Model file must be a .pkl file.';
  }
  if (!datasetFile.name.endsWith('.csv')) {
    return 'Dataset file must be a .csv file.';
  }
  return null;
};

const setSuggestedSensitiveCols = (tokens = csvSensitiveHints) => {
  if (!sensitiveColsSelect) return;
  const options = Array.from(sensitiveColsSelect.options);
  options.forEach((option) => {
    const normalized = option.value.toLowerCase();
    option.selected = tokens.some((token) => normalized.includes(token));
  });
};

const showBiasFindings = (data) => {
  if (!topBiasFindings || !findingsGrid) return;

  const findings = Array.isArray(data?.bias_analysis?.top_findings) ? data.bias_analysis.top_findings : [];
  findingsGrid.innerHTML = '';

  if (!findings.length) {
    topBiasFindings.hidden = true;
    return;
  }

  findings.slice(0, 3).forEach((finding, index) => {
    const confidence = Math.round((finding.confidence || 0.85) * 100);
    const card = document.createElement('div');
    card.className = 'finding-card';
    card.innerHTML = `
      <div class="finding-title">${finding.feature || `Finding ${index + 1}`}</div>
      <div class="finding-confidence">Confidence <span class="confidence-badge">${confidence}%</span></div>
      <p class="note">${finding.impact || 'High impact on fairness'}</p>
    `;
    findingsGrid.appendChild(card);
  });

  topBiasFindings.hidden = false;
};

const updateFairnessMeters = (data) => {
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};

  const before = metrics.fairness_score || 0.65;
  const after = correction.fairness_score_after || 0.85;

  fairnessScoreBefore.textContent = formatMetric(before);
  fairnessScoreAfter.textContent = formatMetric(after);

  meterBefore.style.width = `${Math.min(before * 100, 100)}%`;
  meterAfter.style.width = `${Math.min(after * 100, 100)}%`;
};

const generateCorrectionSuggestions = (data) => {
  const suggestions = [];
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};

  if (metrics.demographic_parity_difference > 0.15) {
    suggestions.push('Apply demographic parity constraints to reduce group-level gap.');
  }
  if (metrics.equalized_odds_difference > 0.12) {
    suggestions.push('Tune for equalized odds to align error rates across groups.');
  }
  if (correction.accuracy_after && correction.accuracy_before) {
    const delta = correction.accuracy_after - correction.accuracy_before;
    if (delta > -0.02) suggestions.push('Corrected model is deployment-ready with low accuracy tradeoff.');
    else if (delta > -0.05) suggestions.push('Run one more fairness-accuracy tuning cycle before deployment.');
  }
  if (!suggestions.length) {
    suggestions.push('Model is within acceptable fairness range for the selected attributes.');
  }

  correctionSuggestions.innerHTML = '';
  suggestionPlaceholder.hidden = true;
  suggestions.forEach((suggestion) => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    correctionSuggestions.appendChild(li);
  });
};

const showAuditResults = (data) => {
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};

  dpValue.textContent = formatMetric(metrics.demographic_parity_difference ?? metrics.demographic_parity);
  eoValue.textContent = formatMetric(metrics.equalized_odds_difference ?? metrics.equalized_odds);
  eopValue.textContent = formatMetric(metrics.equal_opportunity_difference ?? metrics.equal_opportunity);

  const flags = Array.isArray(data?.bias_flags?.flags)
    ? data.bias_flags.flags
    : Array.isArray(data?.bias_flags)
      ? data.bias_flags
      : [];

  biasFlagsList.innerHTML = '';
  if (!flags.length) {
    const li = document.createElement('li');
    li.textContent = 'No major bias flags were returned.';
    biasFlagsList.appendChild(li);
  } else {
    flags.forEach((flag) => {
      const li = document.createElement('li');
      li.textContent = flag;
      biasFlagsList.appendChild(li);
    });
  }

  explanationText.textContent =
    typeof data?.gemini_explanation === 'string' && data.gemini_explanation.trim().length
      ? data.gemini_explanation
      : 'Explanation is unavailable for this run.';

  accuracyBeforeValue.textContent = formatMetric(correction.accuracy_before);
  accuracyAfterValue.textContent = formatMetric(correction.accuracy_after);
  improvementValue.textContent = formatPercent(correction.fairness_improvement_pct);
  reportPathText.textContent = typeof data?.report_path === 'string' && data.report_path.trim().length
    ? data.report_path
    : 'No report path returned from backend.';

  auditResults.hidden = false;
};

const exportToJson = () => {
  if (!currentAuditData) return;
  const dataStr = JSON.stringify(currentAuditData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fairlens-audit-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportToPdf = () => {
  if (!currentAuditData) return;

  const data = currentAuditData;
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};
  const flags = Array.isArray(data?.bias_flags?.flags) ? data.bias_flags.flags : [];

  const reportHtml = `<!doctype html>
  <html><head><meta charset="UTF-8" /><title>FairLens Audit Report</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;color:#1f2937}h1{margin-bottom:6px}h2{margin-top:24px}li,p{line-height:1.6}</style>
  </head><body>
  <h1>FairLens Audit Report</h1><p>Generated: ${new Date().toLocaleString()}</p>
  <h2>Metrics</h2>
  <p>Demographic Parity: ${formatMetric(metrics.demographic_parity_difference)}</p>
  <p>Equalized Odds: ${formatMetric(metrics.equalized_odds_difference)}</p>
  <p>Equal Opportunity: ${formatMetric(metrics.equal_opportunity_difference)}</p>
  <p>Fairness Improvement: ${formatPercent(correction.fairness_improvement_pct)}</p>
  <h2>Bias Flags</h2><ul>${flags.map((f) => `<li>${String(f)}</li>`).join('') || '<li>No major bias flags returned.</li>'}</ul>
  <h2>Explanation</h2><p>${String(data?.gemini_explanation || 'No explanation available.')}</p>
  <h2>Correction</h2><p>Accuracy Before: ${formatMetric(correction.accuracy_before)}</p><p>Accuracy After: ${formatMetric(correction.accuracy_after)}</p>
  <script>window.onload=()=>window.print();</script>
  </body></html>`;

  const popup = window.open('', '_blank');
  if (!popup) {
    if (exportNote) exportNote.textContent = 'Popup blocked. Allow popups to export PDF.';
    return;
  }

  popup.document.open();
  popup.document.write(reportHtml);
  popup.document.close();
};

const updateApiStatusBadge = async () => {
  if (!apiConnectionStatus) return;

  const statusDot = apiConnectionStatus.querySelector('.status-dot');
  const statusText = apiConnectionStatus.querySelector('.status-text');

  try {
    const response = await fetch('http://localhost:8080/health', { headers: buildApiHeaders() });
    if (response.ok) {
      statusDot.classList.add('online');
      statusText.textContent = 'API: Online';
      return;
    }
  } catch {
    // no-op
  }

  statusDot.classList.remove('online');
  statusText.textContent = 'API: Offline';
};

const checkApiHealth = async (force = false) => {
  const now = Date.now();
  if (!force && now - apiHealthLastCheckedAt < 6000) return;
  apiHealthLastCheckedAt = now;
  await updateApiStatusBadge();
};

const handleLogout = () => {
  localStorage.removeItem(authTokenStorageKey);
  localStorage.removeItem(authEmailStorageKey);
  window.location.href = 'index.html';
};

if (!hasAuthToken()) {
  window.location.href = 'access.html?next=audit';
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

if (fairnessThreshold && thresholdValue) {
  fairnessThreshold.addEventListener('input', () => {
    thresholdValue.textContent = Number(fairnessThreshold.value).toFixed(2);
  });
}

if (datasetFileInput && sensitiveColsSelect) {
  datasetFileInput.addEventListener('change', async () => {
    const file = datasetFileInput.files?.[0];
    sensitiveColsSelect.innerHTML = '';
    if (!file) return;

    try {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
      const headers = parseCsvHeader(firstLine);

      headers.forEach((header) => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        const normalized = header.toLowerCase();
        if (csvSensitiveHints.some((token) => normalized.includes(token))) {
          option.selected = true;
        }
        sensitiveColsSelect.appendChild(option);
      });

      setSuggestedSensitiveCols();
      setAuditStatus(headers.length ? 'Dataset loaded. Select columns and run audit.' : 'CSV header could not be parsed.', headers.length ? 'normal' : 'error');
    } catch {
      setAuditStatus('Unable to read the CSV file.', 'error');
    }
  });
}

if (useDemoPresetBtn) {
  useDemoPresetBtn.addEventListener('click', () => {
    setSuggestedSensitiveCols(['gender', 'location', 'age', 'region']);
    fairnessThreshold.value = '0.10';
    thresholdValue.textContent = '0.10';
    setAuditStatus('Demo preset applied. Upload demo files and run audit.');
  });
}

if (tryAuditForm && modelFileInput && datasetFileInput && sensitiveColsSelect && fairnessThreshold) {
  tryAuditForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const modelFile = modelFileInput.files?.[0];
    const datasetFile = datasetFileInput.files?.[0];
    const selectedSensitive = Array.from(sensitiveColsSelect.selectedOptions).map((option) => option.value);

    if (!modelFile || !datasetFile) {
      setAuditStatus('Please upload both model and dataset files.', 'error');
      return;
    }

    const validationError = validateFiles(modelFile, datasetFile);
    if (validationError) {
      fileValidationError.textContent = validationError;
      fileValidationError.hidden = false;
      setAuditStatus('File validation failed. Check the error above.', 'error');
      return;
    }

    fileValidationError.hidden = true;

    if (!selectedSensitive.length) {
      setAuditStatus('Select at least one sensitive column.', 'error');
      return;
    }

    if (runAuditBtn.disabled) return;

    setRunAuditLoading(true);
    auditLoadingSpinner.hidden = false;
    explainLoadingSpinner.hidden = false;
    auditLoadingText.textContent = 'Running fairness audit...';
    setAuditStatus('Running audit...');
    auditResults.hidden = true;
    topBiasFindings.hidden = true;
    exportActions.hidden = true;

    const payload = new FormData();
    payload.append('model_file', modelFile);
    payload.append('dataset_file', datasetFile);
    payload.append('sensitive_cols', selectedSensitive.join(','));
    payload.append('fairness_threshold', fairnessThreshold.value);

    try {
      const response = await fetch('http://localhost:8080/audit', {
        method: 'POST',
        headers: buildApiHeaders(),
        body: payload
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAuditStatus('Unauthorized. Please login again and retry.', 'error');
          return;
        }
        throw new Error(`Audit request failed with ${response.status}`);
      }

      const data = await response.json();
      currentAuditData = data;

      showAuditResults(data);
      showBiasFindings(data);
      updateFairnessMeters(data);
      generateCorrectionSuggestions(data);

      exportActions.hidden = false;
      exportNote.textContent = 'Report ready for download.';
      setAuditStatus('Audit completed successfully.', 'success');
    } catch {
      setAuditStatus('Could not reach backend audit API. Start FastAPI server on localhost:8080 and retry.', 'error');
    } finally {
      setRunAuditLoading(false);
      auditLoadingSpinner.hidden = true;
      explainLoadingSpinner.hidden = true;
    }
  });
}

if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPdf);
if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportToJson);

checkApiHealth(true);
window.setInterval(() => checkApiHealth(false), 15000);
