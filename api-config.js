// Frontend API endpoint config for local and hosted environments.
(function configureFairLensApiBase() {
  var hasExplicit = typeof window.FAIRLENS_API_BASE_URL === "string" && window.FAIRLENS_API_BASE_URL.trim().length > 0;
  if (hasExplicit) {
    window.FAIRLENS_API_BASE_URL = window.FAIRLENS_API_BASE_URL.trim().replace(/\/+$/, "");
    return;
  }

  var host = String(window.location.hostname || "").toLowerCase();
  var isLocal = host === "localhost" || host === "127.0.0.1";
  window.FAIRLENS_API_BASE_URL = isLocal
    ? "http://localhost:8080"
    : "https://fairlens-india.onrender.com";
})();
