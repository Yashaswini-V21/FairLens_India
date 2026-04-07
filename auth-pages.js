const defaultFirebaseConfig = {
  apiKey: "AIzaSyBCogYd49Y5_f6FXJ04xOm3u8tjaz1cfSg",
  authDomain: "fairlensindia.firebaseapp.com",
  projectId: "fairlensindia",
  storageBucket: "fairlensindia.firebasestorage.app",
  messagingSenderId: "196582323392",
  appId: "1:196582323392:web:0759ed647fb052e0fa2925",
  measurementId: "G-0WGR1WP920"
};

const localUsersStorageKey = "fairlens-local-users";
const demoUserEmail = "demo@fairlens.ai";
const demoUserPassword = "FairLens@123";

const authMode = document.body.dataset.authMode === "signup" ? "signup" : "login";
const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const confirmInput = document.getElementById("authConfirmPassword");
const authForm = document.getElementById("authForm");
const googleBtn = document.getElementById("googleBtn");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const urlParams = new URLSearchParams(window.location.search);

const authTokenStorageKey = "fairlens-auth-token";
const authUserEmailStorageKey = "fairlens-auth-email";

const readLocalUsers = () => {
  try {
    const raw = localStorage.getItem(localUsersStorageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalUsers = (users) => {
  localStorage.setItem(localUsersStorageKey, JSON.stringify(users));
};

const ensureDemoUser = () => {
  const users = readLocalUsers();
  const index = users.findIndex((user) => String(user?.email || "").toLowerCase() === demoUserEmail);

  if (index >= 0) {
    users[index] = {
      ...users[index],
      email: demoUserEmail,
      password: demoUserPassword,
      source: "seeded-demo",
    };
  } else {
    users.push({
      email: demoUserEmail,
      password: demoUserPassword,
      source: "seeded-demo",
    });
  }

  writeLocalUsers(users);
};

const runtimeFirebaseConfig = window.FAIRLENS_FIREBASE_CONFIG;

const hasRequiredFirebaseFields = (config) => {
  if (!config || typeof config !== "object") {
    return false;
  }
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  return required.every((key) => typeof config[key] === "string" && config[key].trim().length > 0);
};

const getFirebaseConfig = () => {
  if (hasRequiredFirebaseFields(runtimeFirebaseConfig)) {
    return {
      ...defaultFirebaseConfig,
      ...runtimeFirebaseConfig,
    };
  }

  return defaultFirebaseConfig;
};

const buildLocalDemoToken = (email) => `demo-${Date.now()}-${btoa((email || "user").slice(0, 16))}`;

const isInvalidApiKeyError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code.includes("api-key-not-valid") || code.includes("invalid-api-key") || message.includes("api-key-not-valid") || message.includes("valid-api-key");
};

const createLocalUser = (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const users = readLocalUsers();
  const exists = users.some((user) => String(user?.email || "").toLowerCase() === normalizedEmail);
  if (exists) {
    return { ok: false, message: "User already exists. Please login instead." };
  }
  users.push({
    email: normalizedEmail,
    password,
    source: "local-signup",
  });
  writeLocalUsers(users);
  return { ok: true };
};

const verifyLocalUser = (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (normalizedEmail === demoUserEmail && String(password || "") === demoUserPassword) {
    return true;
  }

  const users = readLocalUsers();
  return users.some(
    (user) => String(user?.email || "").toLowerCase() === normalizedEmail && String(user?.password || "") === password
  );
};

const setStatus = (message, tone = "normal") => {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.style.color = tone === "error" ? "#dc2626" : tone === "success" ? "#15803d" : "#5b6f87";
};

const setLoadingState = (loading, actionLabel = "Continue") => {
  if (submitBtn) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "Processing..." : actionLabel;
  }
  if (googleBtn) {
    googleBtn.disabled = loading;
    googleBtn.textContent = loading ? "Please wait..." : "Continue with Google";
  }
};

const initializeAuth = () => {
  if (!window.firebase || !window.firebase.initializeApp || !window.firebase.auth) {
    setStatus("Firebase SDK not loaded. Refresh page and try again.", "error");
    return null;
  }

  try {
    const firebaseConfig = getFirebaseConfig();
    const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(firebaseConfig);
    return window.firebase.auth(app);
  } catch {
    setStatus("Firebase config load failed. Using local demo auth mode.", "error");
    return null;
  }
};

const auth = initializeAuth();

const saveUserSession = async (user) => {
  if (!user) {
    return;
  }
  const token = await user.getIdToken(true);
  localStorage.setItem(authTokenStorageKey, token);
  localStorage.setItem(authUserEmailStorageKey, user.email || "signed-in-user");
};

const saveLocalDemoSession = (email) => {
  localStorage.setItem(authTokenStorageKey, buildLocalDemoToken(email));
  localStorage.setItem(authUserEmailStorageKey, email || "demo-user@fairlens.local");
};

const runLocalCredentialFlow = ({ mode, email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (mode === "signup") {
    const created = createLocalUser(normalizedEmail, password);
    if (!created.ok) {
      return { ok: false, message: created.message || "Could not create local user." };
    }
    saveLocalDemoSession(normalizedEmail);
    return { ok: true, message: "Account created in local demo mode.", tone: "success" };
  }

  const valid = verifyLocalUser(normalizedEmail, password);
  if (!valid) {
    return {
      ok: false,
      message: `Invalid credentials. Demo user: ${demoUserEmail} / ${demoUserPassword}`,
      tone: "error",
    };
  }

  saveLocalDemoSession(normalizedEmail);
  return { ok: true, message: "Logged in with local credentials.", tone: "success" };
};

const getNextRoute = () => {
  const next = (urlParams.get("next") || "").trim().toLowerCase();
  return next === "audit" ? "index.html?openAudit=1" : "index.html";
};

const goToHome = () => {
  window.location.href = getNextRoute();
};

ensureDemoUser();

if (authMode === "login") {
  setStatus(`Demo login: ${demoUserEmail} / ${demoUserPassword}`);
}

if (googleBtn && auth) {
  googleBtn.addEventListener("click", async () => {
    setLoadingState(true, authMode === "signup" ? "Create Account" : "Login");
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      await saveUserSession(result.user);
      setStatus("Signed in with Google.", "success");
      window.setTimeout(goToHome, 500);
    } catch (error) {
      if (isInvalidApiKeyError(error)) {
        setStatus("Firebase API key invalid. Check Firebase Console: correct Web API key, enable Email/Password auth, and authorize localhost domain.", "error");
        return;
      }
      setStatus(error?.message || "Google sign-in failed.", "error");
    } finally {
      setLoadingState(false, authMode === "signup" ? "Create Account" : "Login");
    }
  });
}

if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";
    const confirm = confirmInput?.value || "";

    if (!email || !password) {
      setStatus("Email and password are required.", "error");
      return;
    }

    if (authMode === "signup" && password !== confirm) {
      setStatus("Passwords do not match.", "error");
      return;
    }

    setLoadingState(true, authMode === "signup" ? "Create Account" : "Login");

    try {
      if (auth) {
        const result = authMode === "signup"
          ? await auth.createUserWithEmailAndPassword(email, password)
          : await auth.signInWithEmailAndPassword(email, password);

        await saveUserSession(result.user);
        setStatus(authMode === "signup" ? "Account created successfully." : "Logged in successfully.", "success");
        window.setTimeout(goToHome, 500);
        return;
      }

      const localResult = runLocalCredentialFlow({ mode: authMode, email, password });
      if (!localResult.ok) {
        setStatus(localResult.message || "Local auth failed.", localResult.tone || "error");
        return;
      }

      setStatus(`${localResult.message} (Local demo mode)`, "success");
      window.setTimeout(goToHome, 500);
    } catch (error) {
      const localResult = runLocalCredentialFlow({ mode: authMode, email, password });
      if (localResult.ok) {
        const detail = isInvalidApiKeyError(error)
          ? "Firebase key/config invalid."
          : "Firebase auth unavailable.";
        setStatus(`${detail} Continued in local mode for this device.`, "success");
        window.setTimeout(goToHome, 700);
        return;
      }

      const firebaseMessage = String(error?.message || "Authentication failed.");
      setStatus(`${firebaseMessage} Also local fallback failed: ${localResult.message || "unknown error"}`, "error");
    } finally {
      setLoadingState(false, authMode === "signup" ? "Create Account" : "Login");
    }
  });
}
