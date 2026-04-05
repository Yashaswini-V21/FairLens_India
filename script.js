const revealItems = Array.from(document.querySelectorAll('.reveal'));
const yearStamp = document.getElementById('yearStamp');
const splashScreen = document.getElementById('splashScreen');

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

const csvSensitiveHints = ['gender', 'sex', 'caste', 'religion', 'age', 'disability', 'region', 'state', 'language'];

if (yearStamp) {
  yearStamp.textContent = String(new Date().getFullYear());
}

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
  auditModal.classList.add('show');
  auditModal.setAttribute('aria-hidden', 'false');
  setActiveAuditTab('input');
  lockBody();
};

const setActiveAuditTab = (tabKey) => {
  const tabToPanel = {
    input: auditPanelInput,
    metrics: auditPanelMetrics,
    explain: auditPanelExplain
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
  auditModal.classList.remove('show');
  auditModal.setAttribute('aria-hidden', 'true');
  unlockBody();
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
  dpValue.textContent = formatMetric(metrics.demographic_parity);
  eoValue.textContent = formatMetric(metrics.equalized_odds);
  eopValue.textContent = formatMetric(metrics.equal_opportunity);

  const flags = Array.isArray(data?.bias_flags) ? data.bias_flags : [];
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

  auditResults.hidden = false;
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
        body: payload
      });

      if (!response.ok) {
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
