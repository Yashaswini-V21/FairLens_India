const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const localUsersStorageKey = "fairlens-local-users";
const authMode = ["signup", "login", "access"].includes(document.body.dataset.authMode)
  ? document.body.dataset.authMode
  : "access";
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

const firebaseConfig = getFirebaseConfig();
const firebaseConfigured = hasRequiredFirebaseFields(firebaseConfig);

const buildLocalSessionToken = (email) => `local-${Date.now()}-${btoa((email || "user").slice(0, 16))}`;

const isInvalidApiKeyError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code.includes("api-key-not-valid") || code.includes("invalid-api-key") || message.includes("api-key-not-valid") || message.includes("valid-api-key");
};

const isUserNotFoundError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  return code.includes("user-not-found") || code.includes("invalid-credential") || code.includes("wrong-password");
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

  if (!firebaseConfigured) {
    setStatus("Firebase is not configured. Using local access mode.");
    return null;
  }

  try {
    const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(firebaseConfig);
    return window.firebase.auth(app);
  } catch {
    setStatus("Firebase initialization failed. Using local access mode.", "error");
    return null;
  }
};

const auth = initializeAuth();

if (googleBtn && !auth) {
  googleBtn.disabled = true;
  googleBtn.textContent = "Google sign-in unavailable";
}

const saveUserSession = async (user) => {
  if (!user) {
    return;
  }
  const token = await user.getIdToken(true);
  localStorage.setItem(authTokenStorageKey, token);
  localStorage.setItem(authUserEmailStorageKey, user.email || "signed-in-user");
};

const saveLocalSession = (email) => {
  localStorage.setItem(authTokenStorageKey, buildLocalSessionToken(email));
  localStorage.setItem(authUserEmailStorageKey, email || "local-user@fairlens.local");
};

const runLocalCredentialFlow = ({ mode, email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (mode === "signup") {
    const created = createLocalUser(normalizedEmail, password);
    if (!created.ok) {
      return { ok: false, message: created.message || "Could not create local user." };
    }
    saveLocalSession(normalizedEmail);
    return { ok: true, message: "Account created successfully.", tone: "success" };
  }

  if (mode === "access") {
    const valid = verifyLocalUser(normalizedEmail, password);
    if (valid) {
      saveLocalSession(normalizedEmail);
      return { ok: true, message: "Workspace access granted.", tone: "success" };
    }

    const created = createLocalUser(normalizedEmail, password);
    if (!created.ok) {
      return { ok: false, message: created.message || "Could not create local user.", tone: "error" };
    }

    saveLocalSession(normalizedEmail);
    return { ok: true, message: "Workspace created and access granted.", tone: "success" };
  }

  const valid = verifyLocalUser(normalizedEmail, password);
  if (!valid) {
    return {
      ok: false,
      message: "Invalid credentials for this device.",
      tone: "error",
    };
  }

  saveLocalSession(normalizedEmail);
  return { ok: true, message: "Logged in with local credentials.", tone: "success" };
};

const getNextRoute = () => {
  const next = (urlParams.get("next") || "").trim().toLowerCase();
  return next === "audit" ? "audit.html" : "index.html";
};

const goToHome = () => {
  window.location.href = getNextRoute();
};

if (googleBtn && auth) {
  googleBtn.addEventListener("click", async () => {
    setLoadingState(true, authMode === "signup" ? "Create Account" : authMode === "access" ? "Enter Workspace" : "Login");
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
      setLoadingState(false, authMode === "signup" ? "Create Account" : authMode === "access" ? "Enter Workspace" : "Login");
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

    setLoadingState(true, authMode === "signup" ? "Create Account" : authMode === "access" ? "Enter Workspace" : "Login");

    try {
      if (auth) {
        let result;
        if (authMode === "signup") {
          result = await auth.createUserWithEmailAndPassword(email, password);
        } else if (authMode === "access") {
          try {
            result = await auth.signInWithEmailAndPassword(email, password);
          } catch (error) {
            if (!isUserNotFoundError(error)) {
              throw error;
            }
            result = await auth.createUserWithEmailAndPassword(email, password);
          }
        } else {
          result = await auth.signInWithEmailAndPassword(email, password);
        }

        await saveUserSession(result.user);
        setStatus(
          authMode === "signup"
            ? "Account created successfully."
            : authMode === "access"
              ? "Workspace access granted."
              : "Logged in successfully.",
          "success"
        );
        window.setTimeout(goToHome, 500);
        return;
      }

      const localResult = runLocalCredentialFlow({ mode: authMode, email, password });
      if (!localResult.ok) {
        setStatus(localResult.message || "Local auth failed.", localResult.tone || "error");
        return;
      }

      setStatus(`${localResult.message} (Local mode)`, "success");
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
      setLoadingState(false, authMode === "signup" ? "Create Account" : authMode === "access" ? "Enter Workspace" : "Login");
    }
  });
}
