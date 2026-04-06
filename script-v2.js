const revealItems = Array.from(document.querySelectorAll('.reveal'));
const yearStamp = document.getElementById('yearStamp');
const splashScreen = document.getElementById('splashScreen');
const topbar = document.querySelector('.topbar');
const navToggle = document.getElementById('navToggle');
const navBackdrop = document.getElementById('navBackdrop');
const setFirebaseTokenBtn = document.getElementById('setFirebaseTokenBtn');
const setApiKeyBtn = document.getElementById('setApiKeyBtn');
const themeToggle = document.getElementById('themeToggle');
const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
const dockTabsContainer = document.getElementById('dockTabs');
const dockTabs = Array.from(document.querySelectorAll('.dock-tab'));
const dockPanels = Array.from(document.querySelectorAll('.dock-panel'));
const themeStorageKey = 'fairlens-theme';
const apiKeyStorageKey = 'fairlens-api-key';
const firebaseTokenStorageKey = 'fairlens-firebase-token';
const firebaseConfigStorageKey = 'fairlens-firebase-config';

const auditModal = document.getElementById('auditModal');
const auditModalOverlay = document.getElementById('auditModalOverlay');
const openAuditTop = document.getElementById('openAuditTop');
const openAuditHero = document.getElementById('openAuditHero');
const openAuditFooter = document.getElementById('openAuditFooter');
const closeAuditModal = document.getElementById('closeAuditModal');

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
const firebaseAuthStatus = document.getElementById('firebaseAuthStatus');
const setFirebaseConfigBtn = document.getElementById('setFirebaseConfigBtn');
const firebaseSignInBtn = document.getElementById('firebaseSignInBtn');
const firebaseSignOutBtn = document.getElementById('firebaseSignOutBtn');
let apiHealthLastCheckedAt = 0;
let firebaseAppInstance = null;
let firebaseAuthInstance = null;
let firebaseUser = null;

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

const readStoredApiKey = () => {
  try {
    const value = localStorage.getItem(apiKeyStorageKey);
    return value && value.trim().length ? value.trim() : null;
  } catch {
    return null;
  }
};

const writeStoredApiKey = (apiKey) => {
  try {
    if (apiKey && apiKey.trim().length) {
      localStorage.setItem(apiKeyStorageKey, apiKey.trim());
    } else {
      localStorage.removeItem(apiKeyStorageKey);
    }
  } catch {
    // Ignore storage write failures in restricted modes.
  }
};

const readStoredFirebaseToken = () => {
  try {
    const value = localStorage.getItem(firebaseTokenStorageKey);
    return value && value.trim().length ? value.trim() : null;
  } catch {
    return null;
  }
};

const writeStoredFirebaseToken = (token) => {
  try {
    if (token && token.trim().length) {
      localStorage.setItem(firebaseTokenStorageKey, token.trim());
    } else {
      localStorage.removeItem(firebaseTokenStorageKey);
    }
  } catch {
    // Ignore storage write failures in restricted modes.
  }
};

const readStoredFirebaseConfig = () => {
  try {
    const raw = localStorage.getItem(firebaseConfigStorageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredFirebaseConfig = (config) => {
  try {
    if (config && typeof config === 'object') {
      localStorage.setItem(firebaseConfigStorageKey, JSON.stringify(config));
    } else {
      localStorage.removeItem(firebaseConfigStorageKey);
    }
  } catch {
    // Ignore storage write failures in restricted modes.
  }
};

const firebaseAvailable = () => Boolean(window.firebase && window.firebase.apps && window.firebase.auth);

const sanitizeFirebaseConfig = (candidate) => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const config = {
    apiKey: String(candidate.apiKey || '').trim(),
    authDomain: String(candidate.authDomain || '').trim(),
    projectId: String(candidate.projectId || '').trim(),
    appId: String(candidate.appId || '').trim()
  };

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    return null;
  }

  return config;
};

const setFirebaseStatus = (message, tone = 'normal') => {
  if (!firebaseAuthStatus) {
    return;
  }
  firebaseAuthStatus.textContent = message;
  firebaseAuthStatus.style.color = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '';
};

const getFirebaseConfig = () => sanitizeFirebaseConfig(readStoredFirebaseConfig());

const initFirebaseClient = () => {
  if (!firebaseAvailable()) {
    setFirebaseStatus('Firebase SDK is not loaded. Refresh the page if scripts are blocked.', 'error');
    return false;
  }

  const config = getFirebaseConfig();
  if (!config) {
    setFirebaseStatus('Firebase config missing. Click Set Firebase Config.', 'normal');
    return false;
  }

  try {
    if (!firebaseAppInstance) {
      firebaseAppInstance = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
      firebaseAuthInstance = window.firebase.auth();
      firebaseAuthInstance.onAuthStateChanged(async (user) => {
        firebaseUser = user;
        if (user) {
          try {
            const token = await user.getIdToken(true);
            writeStoredFirebaseToken(token);
            refreshFirebaseButtonLabel();
            setFirebaseStatus(`Signed in as ${user.email || 'Firebase user'}.`, 'success');
          } catch {
            setFirebaseStatus('Signed in, but token refresh failed.', 'error');
          }
        } else {
          writeStoredFirebaseToken(null);
          refreshFirebaseButtonLabel();
          setFirebaseStatus('Signed out. Firebase auth is idle.', 'normal');
        }
      });
    }

    return true;
  } catch (error) {
    setFirebaseStatus('Firebase init failed. Check your config values.', 'error');
    return false;
  }
};

const buildApiHeaders = (baseHeaders = {}) => {
  const headers = { ...baseHeaders };
  const firebaseToken = readStoredFirebaseToken();
  if (firebaseToken) {
    headers.Authorization = `Bearer ${firebaseToken}`;
  }
  const apiKey = readStoredApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
};

const refreshFirebaseButtonLabel = () => {
  if (!setFirebaseTokenBtn) {
    return;
  }
  const hasToken = Boolean(readStoredFirebaseToken());
  setFirebaseTokenBtn.textContent = hasToken ? 'Firebase Set' : 'Firebase Auth';
};

const refreshFirebaseAuthButtonState = () => {
  if (firebaseSignInBtn) {
    firebaseSignInBtn.disabled = !getFirebaseConfig();
  }
  if (firebaseSignOutBtn) {
    firebaseSignOutBtn.disabled = !firebaseUser;
  }
};

const refreshApiButtonLabel = () => {
  if (!setApiKeyBtn) {
    return;
  }
  const hasApiKey = Boolean(readStoredApiKey());
  setApiKeyBtn.textContent = hasApiKey ? 'API Key Set' : 'Set API Key';
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
refreshApiButtonLabel();
refreshFirebaseButtonLabel();
refreshFirebaseAuthButtonState();

if (setFirebaseConfigBtn) {
  setFirebaseConfigBtn.addEventListener('click', () => {
    const current = getFirebaseConfig() || { apiKey: '', authDomain: '', projectId: '', appId: '' };
    const raw = window.prompt(
      'Paste Firebase web config as JSON with apiKey, authDomain, projectId, appId.',
      JSON.stringify(current)
    );

    if (raw === null) {
      return;
    }

    try {
      const parsed = sanitizeFirebaseConfig(JSON.parse(raw));
      if (!parsed) {
        setFirebaseStatus('Firebase config incomplete. Need apiKey, authDomain, projectId, appId.', 'error');
        return;
      }
      writeStoredFirebaseConfig(parsed);
      setFirebaseStatus('Firebase config saved. Click Google sign-in next.', 'success');
      initFirebaseClient();
      refreshFirebaseAuthButtonState();
      checkApiHealth(true);
    } catch {
      setFirebaseStatus('Invalid JSON. Paste the Firebase web config object.', 'error');
    }
  });
}

if (firebaseSignInBtn) {
  firebaseSignInBtn.addEventListener('click', async () => {
    if (!initFirebaseClient()) {
      return;
    }
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      await firebaseAuthInstance.signInWithPopup(provider);
      await checkApiHealth(true);
      refreshFirebaseAuthButtonState();
    } catch (error) {
      setFirebaseStatus('Google sign-in failed. Allow popups or try again.', 'error');
    }
  });
}

if (firebaseSignOutBtn) {
  firebaseSignOutBtn.addEventListener('click', async () => {
    if (!firebaseAuthInstance) {
      return;
    }
    try {
      await firebaseAuthInstance.signOut();
      firebaseUser = null;
      writeStoredFirebaseToken(null);
      refreshFirebaseButtonLabel();
      refreshFirebaseAuthButtonState();
      setFirebaseStatus('Signed out successfully.', 'success');
    } catch {
      setFirebaseStatus('Sign out failed.', 'error');
    }
  });
}

initFirebaseClient();

if (setFirebaseTokenBtn) {
  setFirebaseTokenBtn.addEventListener('click', () => {
    const current = readStoredFirebaseToken() || '';
    const input = window.prompt('Paste Firebase ID token. Leave empty to clear it.', current);
    if (input === null) {
      return;
    }
    writeStoredFirebaseToken(input);
    refreshFirebaseButtonLabel();
    checkApiHealth(true);
  });
}

if (setApiKeyBtn) {
  setApiKeyBtn.addEventListener('click', () => {
    const current = readStoredApiKey() || '';
    const input = window.prompt('Enter backend API key. Leave empty to clear it.', current);
    if (input === null) {
      return;
    }
    writeStoredApiKey(input);
    refreshApiButtonLabel();
    checkApiHealth(true);
  });
}

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

const openAuditModal = () => {
  if (!auditModal) {
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
    return;
  }

  window.setTimeout(() => {
    splashScreen.classList.add('hidden');
    unlockBody();
  }, 1900);
});

if (openAuditTop) {
  openAuditTop.addEventListener('click', openAuditModal);
}

if (openAuditHero) {
  openAuditHero.addEventListener('click', openAuditModal);
}

if (openAuditFooter) {
  openAuditFooter.addEventListener('click', openAuditModal);
}

if (closeAuditModal) {
  closeAuditModal.addEventListener('click', closeAuditModalPanel);
}

if (auditModalOverlay) {
  auditModalOverlay.addEventListener('click', closeAuditModalPanel);
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
    const response = await fetch('http://localhost:8080/health', {
      headers: buildApiHeaders()
    });
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    apiConnectionStatus.textContent = 'API: connected on localhost:8080';
    apiConnectionStatus.dataset.state = 'ok';
  } catch (error) {
    apiConnectionStatus.textContent = 'API: offline (start backend on :8080)';
    apiConnectionStatus.dataset.state = 'error';
  }
  refreshFirebaseAuthButtonState();
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

    const modelFile = modelFileInput.files?.[0];
    const datasetFile = datasetFileInput.files?.[0];
    const selectedSensitive = Array.from(sensitiveColsSelect.selectedOptions).map((option) => option.value);

    if (!modelFile || !datasetFile) {
      setAuditStatus('Please upload both model and dataset files.', 'error');
      return;
    }

    if (!selectedSensitive.length) {
      setAuditStatus('Select at least one sensitive column.', 'error');
      return;
    }

    setAuditStatus('Running audit... this can take a few moments.');
    auditResults.hidden = true;

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
          setAuditStatus('Unauthorized. Click Set API Key in top bar, then retry.', 'error');
          setActiveAuditTab('input');
          return;
        }
        throw new Error(`Audit request failed with ${response.status}`);
      }

      const data = await response.json();
      showAuditResults(data);
      setAuditStatus('Audit completed successfully.', 'success');
      setActiveAuditTab('metrics');
    } catch (error) {
      setAuditStatus('Could not reach backend audit API. Start FastAPI server on localhost:8080 and retry.', 'error');
      setActiveAuditTab('input');
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
