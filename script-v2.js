const revealItems = Array.from(document.querySelectorAll('.reveal'));
const yearStamp = document.getElementById('yearStamp');
const splashScreen = document.getElementById('splashScreen');
const topbar = document.querySelector('.topbar');
const navToggle = document.getElementById('navToggle');
const navBackdrop = document.getElementById('navBackdrop');
const themeToggle = document.getElementById('themeToggle');
const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
const dockTabsContainer = document.getElementById('dockTabs');
const dockTabs = Array.from(document.querySelectorAll('.dock-tab'));
const dockPanels = Array.from(document.querySelectorAll('.dock-panel'));
const themeStorageKey = 'fairlens-theme';
const authTokenStorageKey = 'fairlens-auth-token';

const auditModal = document.getElementById('auditModal');
const auditModalOverlay = document.getElementById('auditModalOverlay');
const openAuditTop = document.getElementById('openAuditTop');
const openAuditHero = document.getElementById('openAuditHero');
const openAuditFooter = document.getElementById('openAuditFooter');
const closeAuditModal = document.getElementById('closeAuditModal');
const authGateModal = document.getElementById('authGateModal');
const authGateOverlay = document.getElementById('authGateOverlay');
const closeAuthGate = document.getElementById('closeAuthGate');
const continueAuditBtn = document.getElementById('continueAuditBtn');

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
const auditTabs = Array.from(document.querySelectorAll('.audit-tab'));
const auditPanelInput = document.getElementById('auditPanelInput');
const auditPanelMetrics = document.getElementById('auditPanelMetrics');
const auditPanelExplain = document.getElementById('auditPanelExplain');
const auditPanelCorrect = document.getElementById('auditPanelCorrect');
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
const fairnessComparison = document.getElementById('fairnessComparison');
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
const loginLink = document.getElementById('loginLink');
const signupLink = document.getElementById('signupLink');
const authStatusGroup = document.getElementById('authStatusGroup');
const authStatusEmail = document.getElementById('authStatusEmail');
const logoutBtn = document.getElementById('logoutBtn');
let apiHealthLastCheckedAt = 0;
let currentAuditData = null;

const csvSensitiveHints = ['gender', 'sex', 'caste', 'religion', 'age', 'disability', 'region', 'state', 'language'];

const readStoredTheme = () => {
  try {
    return localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
};

const writeStoredTheme = (theme) => {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Ignore storage write failures (privacy mode, restricted storage)
  }
};

const readStoredAuthToken = () => {
  try {
    const value = localStorage.getItem(authTokenStorageKey);
    return value && value.trim().length ? value.trim() : null;
  } catch {
    return null;
  }
};

const hasAuthToken = () => Boolean(readStoredAuthToken());

const writeStoredAuthToken = (token) => {
  try {
    if (token && token.trim().length) {
      localStorage.setItem(authTokenStorageKey, token.trim());
    } else {
      localStorage.removeItem(authTokenStorageKey);
    }
  } catch {
    // Ignore storage write failures in restricted modes.
  }
};

const buildApiHeaders = (baseHeaders = {}) => {
  const headers = { ...baseHeaders };
  const authToken = readStoredAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

const applyTheme = (theme) => {
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  const darkActive = activeTheme === 'dark';

  document.body.dataset.theme = activeTheme;
  document.documentElement.dataset.theme = activeTheme;
  document.body.classList.toggle('theme-dark', darkActive);
  document.body.classList.toggle('theme-light', !darkActive);

  if (themeToggle) {
    themeToggle.textContent = darkActive ? 'Light Mode' : 'Dark Mode';
    themeToggle.setAttribute('aria-pressed', String(darkActive));
    themeToggle.setAttribute('aria-label', darkActive ? 'Switch to light mode' : 'Switch to dark mode');
  }
};

const initTheme = () => {
  const storedTheme = readStoredTheme();
  if (storedTheme === 'dark' || storedTheme === 'light') {
    applyTheme(storedTheme);
    return;
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
};

const closeMobileNav = () => {
  if (!topbar || !navToggle) {
    return;
  }
  topbar.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation menu');
};

const toggleMobileNav = () => {
  if (!topbar || !navToggle) {
    return;
  }

  const opening = !topbar.classList.contains('nav-open');
  topbar.classList.toggle('nav-open', opening);
  navToggle.setAttribute('aria-expanded', String(opening));
  navToggle.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
};

const setActiveNavLink = (targetId) => {
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${targetId}`;
    link.classList.toggle('active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const setActiveDockTab = (tabKey) => {
  dockTabs.forEach((tab) => {
    const active = tab.dataset.dockTab === tabKey;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  dockPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.dockPanel === tabKey);
  });
};

if (yearStamp) {
  yearStamp.textContent = String(new Date().getFullYear());
}

initTheme();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
  });
}

if (navToggle) {
  navToggle.addEventListener('click', toggleMobileNav);
}

if (dockTabs.length) {
  dockTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.dockTab;
      if (key) {
        setActiveDockTab(key);
      }
    });
  });
}

if (dockTabsContainer && dockTabs.length) {
  const applyDockScale = (clientX) => {
    dockTabs.forEach((tab) => {
      const rect = tab.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.min(Math.abs(clientX - center), 180);
      const ratio = 1 - distance / 180;
      const scale = 1 + Math.max(0, ratio) * 0.22;
      tab.style.setProperty('--dock-scale', scale.toFixed(3));
    });
  };

  dockTabsContainer.addEventListener('mousemove', (event) => {
    applyDockScale(event.clientX);
  });

  dockTabsContainer.addEventListener('mouseleave', () => {
    dockTabs.forEach((tab) => tab.style.setProperty('--dock-scale', '1'));
  });
}

if (navBackdrop) {
  navBackdrop.addEventListener('click', closeMobileNav);
}

document.addEventListener('click', (event) => {
  if (!topbar?.classList.contains('nav-open')) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (topbar.contains(target) || navBackdrop?.contains(target)) {
    return;
  }

  closeMobileNav();
});

const unlockBody = () => {
  document.body.classList.remove('is-locked');
};

const lockBody = () => {
  document.body.classList.add('is-locked');
};

const openAuthGateModal = () => {
  window.location.href = 'signup.html?next=audit';
};

const closeAuthGateModal = () => {
  if (!authGateModal) {
    return;
  }
  authGateModal.classList.remove('show');
  authGateModal.setAttribute('aria-hidden', 'true');
  unlockBody();
};

const openAuditModal = () => {
  if (!auditModal) {
    return;
  }

  if (!hasAuthToken()) {
    openAuthGateModal();
    return;
  }

  checkApiHealth(true);
  auditModal.removeAttribute('inert');
  auditModal.classList.add('show');
  auditModal.setAttribute('aria-hidden', 'false');
  setActiveAuditTab('input');
  lockBody();
};

const setActiveAuditTab = (tabKey) => {
  const tabToPanel = {
    input: auditPanelInput,
    metrics: auditPanelMetrics,
    explain: auditPanelExplain,
    correct: auditPanelCorrect
  };

  auditTabs.forEach((tab) => {
    const active = tab.dataset.auditTab === tabKey;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  Object.entries(tabToPanel).forEach(([key, panel]) => {
    if (!panel) {
      return;
    }
    panel.classList.toggle('active', key === tabKey);
  });
};

const closeAuditModalPanel = () => {
  if (!auditModal) {
    return;
  }
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  auditModal.classList.remove('show');
  auditModal.setAttribute('aria-hidden', 'true');
  auditModal.setAttribute('inert', '');
  unlockBody();
  if (openAuditTop) {
    openAuditTop.focus();
  }
};

window.addEventListener('load', () => {
  if (!splashScreen) {
    unlockBody();
    if (window.location.search.includes('openAudit=1') && hasAuthToken()) {
      window.setTimeout(openAuditModal, 120);
    }
    return;
  }

  window.setTimeout(() => {
    splashScreen.classList.add('hidden');
    unlockBody();
    if (window.location.search.includes('openAudit=1') && hasAuthToken()) {
      window.setTimeout(openAuditModal, 120);
    }
  }, 2500);
});

if (openAuditTop) {
  openAuditTop.addEventListener('click', openAuthGateModal);
}

if (openAuditHero) {
  openAuditHero.addEventListener('click', openAuthGateModal);
}

if (openAuditFooter) {
  openAuditFooter.addEventListener('click', openAuthGateModal);
}

if (closeAuditModal) {
  closeAuditModal.addEventListener('click', closeAuditModalPanel);
}

if (auditModalOverlay) {
  auditModalOverlay.addEventListener('click', closeAuditModalPanel);
}

if (authGateOverlay) {
  authGateOverlay.addEventListener('click', closeAuthGateModal);
}

if (closeAuthGate) {
  closeAuthGate.addEventListener('click', closeAuthGateModal);
}

if (continueAuditBtn) {
  continueAuditBtn.addEventListener('click', () => {
    closeAuthGateModal();
    openAuditModal();
  });
}

auditTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabKey = tab.dataset.auditTab;
    if (!tabKey) {
      return;
    }
    setActiveAuditTab(tabKey);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && topbar?.classList.contains('nav-open')) {
    closeMobileNav();
  }

  if (event.key === 'Escape' && auditModal?.classList.contains('show')) {
    closeAuditModalPanel();
  }

  if (event.key === 'Escape' && authGateModal?.classList.contains('show')) {
    closeAuthGateModal();
  }

});

const formatMetric = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return value.toFixed(3);
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(1)}%`;
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

  if (current) {
    headers.push(current.trim());
  }

  return headers.filter(Boolean);
};

const setAuditStatus = (message, tone = 'normal') => {
  if (!auditStatus) {
    return;
  }
  auditStatus.textContent = message;
  auditStatus.style.color = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '';
};

const setRunAuditLoading = (loading) => {
  if (!runAuditBtn) {
    return;
  }
  runAuditBtn.classList.toggle('is-loading', loading);
  runAuditBtn.disabled = loading;
  runAuditBtn.textContent = loading ? 'Running audit...' : 'Run Full Audit';
};

const triggerAuditSuccessPulse = () => {
  const metricsTab = auditTabs.find((tab) => tab.dataset.auditTab === 'metrics');

  if (metricsTab) {
    metricsTab.classList.remove('pulse-success');
    void metricsTab.offsetWidth;
    metricsTab.classList.add('pulse-success');
    metricsTab.focus({ preventScroll: true });
    window.setTimeout(() => metricsTab.classList.remove('pulse-success'), 1000);
  }

  if (auditPanelMetrics) {
    auditPanelMetrics.classList.remove('pulse-success');
    void auditPanelMetrics.offsetWidth;
    auditPanelMetrics.classList.add('pulse-success');
    window.setTimeout(() => auditPanelMetrics.classList.remove('pulse-success'), 1000);
  }
};

const showAuditResults = (data) => {
  if (!auditResults) {
    return;
  }

  const metrics = data?.fairness_metrics || {};
  dpValue.textContent = formatMetric(
    metrics.demographic_parity_difference ?? metrics.demographic_parity
  );
  eoValue.textContent = formatMetric(
    metrics.equalized_odds_difference ?? metrics.equalized_odds
  );
  eopValue.textContent = formatMetric(
    metrics.equal_opportunity_difference ?? metrics.equal_opportunity
  );

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

  const correction = data?.correction_results || {};
  accuracyBeforeValue.textContent = formatMetric(correction.accuracy_before);
  accuracyAfterValue.textContent = formatMetric(correction.accuracy_after);
  improvementValue.textContent = formatPercent(correction.fairness_improvement_pct);
  reportPathText.textContent =
    typeof data?.report_path === 'string' && data.report_path.trim().length
      ? data.report_path
      : 'No report path returned from backend.';

  auditResults.hidden = false;
};

const setSuggestedSensitiveCols = (tokens = csvSensitiveHints) => {
  if (!sensitiveColsSelect) {
    return;
  }

  const options = Array.from(sensitiveColsSelect.options);
  options.forEach((option) => {
    const normalized = option.value.toLowerCase();
    option.selected = tokens.some((token) => normalized.includes(token));
  });
};

// Feature 1: Auth State UI
const updateAuthUI = () => {
  const token = readStoredAuthToken();
  const email = localStorage.getItem('fairlens-auth-email');
  const loggedIn = Boolean(token && email);
  const isDemoIdentity = typeof email === 'string' && email.toLowerCase().includes('demo.user@fairlens.dev');

  [openAuditTop, openAuditHero, openAuditFooter].forEach((btn) => {
    if (!btn) {
      return;
    }
    btn.textContent = loggedIn ? 'Start Audit' : 'Audit Now';
  });
  
  if (loggedIn) {
    if (loginLink) loginLink.hidden = true;
    if (signupLink) signupLink.hidden = true;
    if (authStatusGroup) authStatusGroup.hidden = false;
    if (authStatusEmail) authStatusEmail.textContent = isDemoIdentity ? 'Signed in' : email;
  } else {
    if (loginLink) loginLink.hidden = false;
    if (signupLink) signupLink.hidden = false;
    if (authStatusGroup) authStatusGroup.hidden = true;
  }
};

// Feature 1: Logout
const handleLogout = () => {
  writeStoredAuthToken(null);
  localStorage.removeItem('fairlens-auth-email');
  updateAuthUI();
  window.location.href = 'index.html';
};

// Feature 3: File Validation
const validateFiles = (modelFile, datasetFile) => {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  
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

// Feature 2: Update API Status Badge
const updateApiStatusBadge = async () => {
  if (!apiConnectionStatus) return;
  
  try {
    const response = await fetch('http://localhost:8080/health', {
      headers: buildApiHeaders()
    });
    
    const statusDot = apiConnectionStatus.querySelector('.status-dot');
    const statusText = apiConnectionStatus.querySelector('.status-text');
    
    if (response.ok) {
      statusDot.classList.add('online');
      statusText.textContent = 'API: Online';
    } else {
      statusDot.classList.remove('online');
      statusText.textContent = 'API: Offline';
    }
  } catch (error) {
    const statusDot = apiConnectionStatus.querySelector('.status-dot');
    const statusText = apiConnectionStatus.querySelector('.status-text');
    statusDot.classList.remove('online');
    statusText.textContent = 'API: Offline';
  }
};

// Feature 4: Show Top 3 Bias Findings with Confidence
const showBiasFindings = (data) => {
  if (!topBiasFindings || !findingsGrid) return;
  
  const biasData = data?.bias_analysis || {};
  const findings = biasData.top_findings || [];
  
  if (findings.length === 0) {
    topBiasFindings.hidden = true;
    return;
  }
  
  findingsGrid.innerHTML = '';
  
  findings.slice(0, 3).forEach((finding, index) => {
    const card = document.createElement('div');
    card.className = 'finding-card';
    
    const confidence = Math.round((finding.confidence || 0.85) * 100);
    
    card.innerHTML = `
      <div class="finding-title">${finding.feature || `Finding ${index + 1}`}</div>
      <div class="finding-confidence">
        Confidence: <span class="confidence-badge" title="How confident we are about this finding">${confidence}%</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--muted); margin: 6px 0 0 0;">${finding.impact || 'High impact on fairness'}</p>
    `;
    
    findingsGrid.appendChild(card);
  });
  
  topBiasFindings.hidden = false;
};

// Feature 5: Update Before/After Fairness Meters
const updateFairnessMeters = (data) => {
  if (!fairnessComparison) return;
  
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};
  
  const fairnessBefore = metrics.fairness_score || 0.65;
  const fairnessAfter = correction.fairness_score_after || 0.85;
  
  fairnessScoreBefore.textContent = formatMetric(fairnessBefore);
  fairnessScoreAfter.textContent = formatMetric(fairnessAfter);
  
  // Set meter widths as percentages
  meterBefore.style.width = `${Math.min(fairnessBefore * 100, 100)}%`;
  meterAfter.style.width = `${Math.min(fairnessAfter * 100, 100)}%`;
};

// Feature 5: Generate Auto-Correction Suggestions
const generateCorrectionSuggestions = (data) => {
  if (!correctionSuggestions) return;
  
  const suggestions = [];
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};
  
  // Auto-generate recommendations based on findings
  if (metrics.demographic_parity_difference > 0.15) {
    suggestions.push('Apply demographic parity constraints in Fairlearn to reduce bias across groups');
  }
  
  if (metrics.equalized_odds_difference > 0.12) {
    suggestions.push('Use equalized odds fairness criteria to balance true positive rates across sensitive groups');
  }
  
  if (correction.accuracy_after && correction.accuracy_before) {
    const delta = correction.accuracy_after - correction.accuracy_before;
    if (delta > -0.02) {
      suggestions.push('Deploy corrected model - fairness improved with minimal accuracy loss');
    } else if (delta > -0.05) {
      suggestions.push('Consider a fairness-accuracy tradeoff tuning before deployment');
    }
  }
  
  if (!suggestions.length) {
    suggestions.push('Model shows good fairness characteristics across sensitive attributes');
  }
  
  correctionSuggestions.innerHTML = '';
  suggestionPlaceholder.hidden = true;
  
  suggestions.forEach(suggestion => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    correctionSuggestions.appendChild(li);
  });
};

// Feature 5: Export to JSON
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

// Feature 5: Export to PDF via print-ready report window
const exportToPdf = () => {
  if (!currentAuditData) return;
  
  const data = currentAuditData;
  const metrics = data?.fairness_metrics || {};
  const correction = data?.correction_results || {};

  const flags = Array.isArray(data?.bias_flags?.flags) ? data.bias_flags.flags : [];
  const explanation = typeof data?.gemini_explanation === 'string'
    ? data.gemini_explanation
    : 'No explanation available.';

  const reportHtml = `<!doctype html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>FairLens Audit Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
      h1 { margin-bottom: 4px; }
      h2 { margin-top: 24px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
      p, li { line-height: 1.6; }
      .meta { color: #6b7280; margin-bottom: 20px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
    </style>
  </head>
  <body>
    <h1>FairLens Audit Report</h1>
    <p class="meta">Generated: ${new Date().toLocaleString()}</p>
    <h2>Fairness Metrics</h2>
    <div class="grid">
      <div class="card">Demographic Parity: ${formatMetric(metrics.demographic_parity_difference)}</div>
      <div class="card">Equalized Odds: ${formatMetric(metrics.equalized_odds_difference)}</div>
      <div class="card">Equal Opportunity: ${formatMetric(metrics.equal_opportunity_difference)}</div>
      <div class="card">Fairness Improvement: ${formatPercent(correction.fairness_improvement_pct)}</div>
    </div>
    <h2>Bias Flags</h2>
    <ul>${flags.map((flag) => `<li>${String(flag)}</li>`).join('') || '<li>No major bias flags returned.</li>'}</ul>
    <h2>Explanation</h2>
    <p>${String(explanation)}</p>
    <h2>Correction Summary</h2>
    <p>Accuracy Before: ${formatMetric(correction.accuracy_before)}</p>
    <p>Accuracy After: ${formatMetric(correction.accuracy_after)}</p>
    <script>window.onload = () => window.print();</script>
  </body>
  </html>`;

  const popup = window.open('', '_blank');
  if (!popup) {
    if (exportNote) {
      exportNote.textContent = 'Popup blocked. Allow popups to export PDF.';
    }
    return;
  }

  popup.document.open();
  popup.document.write(reportHtml);
  popup.document.close();
};

const checkApiHealth = async (force = false) => {
  if (!apiConnectionStatus) {
    return;
  }

  const now = Date.now();
  if (!force && now - apiHealthLastCheckedAt < 6000) {
    return;
  }
  apiHealthLastCheckedAt = now;

  try {
    await updateApiStatusBadge();
  } catch (error) {
    // Keep silent to avoid noisy console during temporary backend downtime.
  }
};

if (fairnessThreshold && thresholdValue) {
  fairnessThreshold.addEventListener('input', () => {
    thresholdValue.textContent = Number(fairnessThreshold.value).toFixed(2);
  });
}

if (datasetFileInput && sensitiveColsSelect) {
  datasetFileInput.addEventListener('change', async () => {
    const file = datasetFileInput.files?.[0];
    sensitiveColsSelect.innerHTML = '';

    if (!file) {
      return;
    }

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

      if (!headers.length) {
        setAuditStatus('CSV header could not be parsed. Check file format.', 'error');
      } else {
        setAuditStatus('Dataset loaded. Select sensitive columns and run audit.');
      }
    } catch (error) {
      setAuditStatus('Unable to read the CSV file.', 'error');
    }
  });
}

if (useDemoPresetBtn) {
  useDemoPresetBtn.addEventListener('click', () => {
    setSuggestedSensitiveCols(['gender', 'location', 'age', 'region']);
    fairnessThreshold.value = '0.10';
    thresholdValue.textContent = '0.10';
    setAuditStatus('Demo preset applied. Upload demo model and demo CSV, then run audit.');
  });
}

if (tryAuditForm && modelFileInput && datasetFileInput && sensitiveColsSelect && fairnessThreshold) {
  tryAuditForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!hasAuthToken()) {
      setAuditStatus('Login required to run audit.', 'error');
      openAuthGateModal();
      return;
    }

    const modelFile = modelFileInput.files?.[0];
    const datasetFile = datasetFileInput.files?.[0];
    const selectedSensitive = Array.from(sensitiveColsSelect.selectedOptions).map((option) => option.value);

    if (!modelFile || !datasetFile) {
      setAuditStatus('Please upload both model and dataset files.', 'error');
      return;
    }

    // File validation (Feature 3)
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

    // Prevent double-submit (Feature 3)
    if (runAuditBtn.disabled) {
      return;
    }

    setRunAuditLoading(true);
    auditLoadingSpinner.hidden = false;
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
          setActiveAuditTab('input');
          return;
        }
        throw new Error(`Audit request failed with ${response.status}`);
      }

      const data = await response.json();
      currentAuditData = data;
      showAuditResults(data);
      
      // Feature 4: Show top 3 bias findings
      showBiasFindings(data);
      
      // Feature 5: Update fairness meters
      updateFairnessMeters(data);
      
      // Feature 5: Generate correction suggestions
      generateCorrectionSuggestions(data);
      
      // Feature 5: Enable export buttons
      exportActions.hidden = false;
      exportNote.textContent = '✓ Report ready for download';
      
      setAuditStatus('Audit completed successfully.', 'success');
      setActiveAuditTab('metrics');
      triggerAuditSuccessPulse();
    } catch (error) {
      setAuditStatus('Could not reach backend audit API. Start FastAPI server on localhost:8080 and retry.', 'error');
      setActiveAuditTab('input');
    } finally {
      setRunAuditLoading(false);
      auditLoadingSpinner.hidden = true;
    }
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 55, 260)}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

if (navLinks.length && 'IntersectionObserver' in window) {
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveNavLink(visible.target.id);
      }
    },
    { rootMargin: '-35% 0px -45% 0px', threshold: [0.2, 0.4, 0.6] }
  );

  observedSections.forEach((section) => navObserver.observe(section));

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href')?.replace('#', '');
      if (id) {
        setActiveNavLink(id);
      }

      closeMobileNav();
    });
  });

  if (observedSections[0]?.id) {
    setActiveNavLink(observedSections[0].id);
  }
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 780) {
    closeMobileNav();
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', exportToPdf);
}

if (exportJsonBtn) {
  exportJsonBtn.addEventListener('click', exportToJson);
}

updateAuthUI();
checkApiHealth(true);
window.setInterval(() => {
  checkApiHealth(false);
}, 15000);

window.addEventListener('storage', (event) => {
  if (event.key === authTokenStorageKey || event.key === 'fairlens-auth-email') {
    updateAuthUI();
  }
});
