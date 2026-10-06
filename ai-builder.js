(() => {
  "use strict";

  const API_BASE = "https://sitecraft-ai.kammarivinaykumar216.workers.dev/api/ai-builder";
  const $ = (selector) => document.querySelector(selector);

  const state = {
    jobId: null,
    formFields: [],
    businessType: "",
    currentPrice: 499,
    previewHtml: "",
    suggestions: [],
    allSuggestions: [],
    installedFeatures: []
  };

  const status = (message, type = "normal") => {
    const el = $("#aiStatus");
    if (!el) return;
    el.textContent = message || "";
    el.className = "ai-status" + (message ? " show" : "") + (type === "error" ? " error" : type === "success" ? " success" : "");
  };

  const setProgress = (labels) => {
    const root = $("#aiProgress");
    root.innerHTML = labels.map(x => "<span class=\"" + (x.done ? "done" : "") + "\">" + escapeHtml(x.label) + "</span>").join("");
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  const api = async (path, options = {}) => {
    const response = await fetch(API_BASE + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({ ok: false, error: "Invalid backend response." }));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  };

  const renderPreview = (html) => {
    state.previewHtml = html || "";
    const frame = $("#aiPreview");
    frame.srcdoc = html || "<!doctype html><html><body><p style='font-family:system-ui;padding:30px'>Preview will appear here.</p></body></html>";
  };

  const inputForField = (field) => {
    const id = escapeHtml(field.id);
    const label = escapeHtml(field.label);
    const placeholder = escapeHtml(field.placeholder || "");
    const help = field.help ? "<small>" + escapeHtml(field.help) + "</small>" : "";
    const required = field.required ? " required" : "";
    let control = "";
    if (field.type === "textarea") {
      control = "<textarea id=\"" + id + "\" name=\"" + id + "\" placeholder=\"" + placeholder + "\"" + required + "></textarea>";
    } else if (field.type === "email") {
      control = "<input id=\"" + id + "\" name=\"" + id + "\" type=\"email\" placeholder=\"" + placeholder + "\"" + required + ">";
    } else if (field.type === "tel" || field.type === "phone") {
      control = "<input id=\"" + id + "\" name=\"" + id + "\" type=\"tel\" placeholder=\"" + placeholder + "\"" + required + ">";
    } else if (field.type === "url") {
      control = "<input id=\"" + id + "\" name=\"" + id + "\" type=\"url\" placeholder=\"" + placeholder + "\"" + required + ">";
    } else {
      control = "<input id=\"" + id + "\" name=\"" + id + "\" type=\"text\" placeholder=\"" + placeholder + "\"" + required + ">";
    }
    return "<label class=\"ai-form-field\"><span>" + label + (field.required ? " <i class=\"ai-required\">required</i>" : "") + "</span>" + control + help + "</label>";
  };

  const collectDetails = () => {
    const details = {};
    for (const field of state.formFields) {
      const el = document.getElementById(field.id);
      if (el) details[field.id] = el.value.trim();
    }
    return details;
  };

  const showSuggestions = (suggestions) => {
    state.suggestions = Array.isArray(suggestions) ? suggestions : [];
    const grid = $("#suggestionGrid");
    const panel = $("#suggestionsPanel");
    panel.classList.toggle("ai-hidden", !state.suggestions.length);
    grid.innerHTML = state.suggestions.map(feature => {
      return "<button class=\"ai-suggestion\" type=\"button\" data-feature=\"" + escapeHtml(feature.id) + "\">" +
        "<strong>" + escapeHtml(feature.name) + "</strong>" +
        "<small>" + escapeHtml(feature.description) + "</small>" +
        "<span class=\"ai-suggestion-price\">+₹" + Number(feature.priceInr || 0).toLocaleString("en-IN") + "</span>" +
        "</button>";
    }).join("");

    grid.querySelectorAll("[data-feature]").forEach(button => {
      button.addEventListener("click", async () => {
        const id = button.dataset.feature;
        button.disabled = true;
        button.innerHTML = "<strong>Adding…</strong><small>Please wait while we update your preview.</small>";
        try {
          status("Adding " + (state.suggestions.find(x => x.id === id)?.name || "feature") + "…");
          setProgress([
            {label:"Base website",done:true},
            {label:"Feature build",done:false},
            {label:"QA",done:false}
          ]);

          const result = await api("/add-feature", {
            method: "POST",
            body: JSON.stringify({ jobId: state.jobId, featureId: id })
          });

          state.currentPrice = Number(result.currentPriceInr || state.currentPrice);
          state.installedFeatures = result.installedFeatures || [];
          $("#aiPrice").textContent = "₹" + state.currentPrice.toLocaleString("en-IN");
          renderPreview(result.previewHtml);
          showSuggestions(result.suggestions || []);
          $("#checkoutBar").classList.remove("ai-hidden");

          status("Feature added. Your preview is updated.", "success");
          setProgress([
            {label:"Base website",done:true},
            {label:"Feature build",done:true},
            {label:"QA complete",done:true}
          ]);
        } catch (error) {
          status(error.message, "error");
          button.disabled = false;
          button.innerHTML =
            "<strong>" + escapeHtml(state.suggestions.find(x => x.id === id)?.name || "Feature") + "</strong>" +
            "<small>Try again</small>";
        }
      });
    });
  };

  $("#analyzeBtn").addEventListener("click", async () => {
    const prompt = $("#aiPrompt").value.trim();
    if (!prompt) {
      status("Please describe the website you want to create.", "error");
      return;
    }

    $("#analyzeBtn").disabled = true;
    status("Understanding your request…");
    setProgress([{label:"Understanding request",done:false}]);

    try {
      const result = await api("/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt })
      });

      state.jobId = result.jobId;
      state.formFields = result.formFields || [];
      state.businessType = result.normalizedBusinessType || result.businessType || "general";

      $("#promptStep").classList.add("ai-hidden");
      $("#detailsStep").classList.remove("ai-hidden");
      $("#buildInfo").classList.remove("ai-hidden");
      $("#detailsTitle").textContent = "Tell us about your " + state.businessType.replace(/_/g, " ") + " business.";
      $("#aiDetailsForm").innerHTML = state.formFields.map(inputForField).join("");

      $("#progressDetails").classList.add("on");
      status(result.firstMessage || "Please complete these details.");
      setProgress([
        {label:"Request understood",done:true},
        {label:"Details form ready",done:true}
      ]);
    } catch (error) {
      status(error.message, "error");
      $("#analyzeBtn").disabled = false;
    }
  });

  $("#buildBtn").addEventListener("click", async () => {
    const form = $("#aiDetailsForm");
    if (!form.reportValidity()) return;

    const details = collectDetails();
    $("#buildBtn").disabled = true;
    status("Building your base website…");
    setProgress([
      {label:"Planning",done:false},
      {label:"Home",done:false},
      {label:"Gallery + Enquiry",done:false},
      {label:"Actions",done:false},
      {label:"QA",done:false}
    ]);

    try {
      const result = await api("/build-base", {
        method: "POST",
        body: JSON.stringify({ jobId: state.jobId, details })
      });

      state.currentPrice = Number(result.currentPriceInr || 499);
      state.installedFeatures = result.installedFeatures || [];
      $("#aiPrice").textContent = "₹" + state.currentPrice.toLocaleString("en-IN");
      $("#previewTitle").textContent = "Base website preview";
      $("#previewSubtitle").textContent = "Your essential website is ready. Add features below.";
      renderPreview(result.previewHtml);
      showSuggestions(result.suggestions || []);
      $("#checkoutBar").classList.remove("ai-hidden");

      $("#detailsStep").classList.add("ai-hidden");
      $("#progressBuild").classList.add("on");
      $("#progressFeatures").classList.add("on");
      $("#progressPay").classList.add("on");

      status("Base website ready. Choose any extra features you want.", "success");
      setProgress([
        {label:"Planning",done:true},
        {label:"Home",done:true},
        {label:"Gallery + Enquiry",done:true},
        {label:"Actions",done:true},
        {label:"QA complete",done:true}
      ]);
    } catch (error) {
      status(error.message, "error");
      $("#buildBtn").disabled = false;
    }
  });

  $("#moreSuggestionsBtn").addEventListener("click", async () => {
    if (!state.jobId) return;
    const button = $("#moreSuggestionsBtn");
    button.disabled = true;
    try {
      const result = await api("/suggestions", {
        method: "POST",
        body: JSON.stringify({ jobId: state.jobId })
      });
      showSuggestions(result.suggestions || []);
      status("Here are the next recommended features.");
    } catch (error) {
      status(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  $("#checkoutBtn").addEventListener("click", () => {
    const params = new URLSearchParams();
    params.set("aiJob", state.jobId || "");
    location.href = "checkout.html?aiJob=" + encodeURIComponent(state.jobId || "");
  });
})();