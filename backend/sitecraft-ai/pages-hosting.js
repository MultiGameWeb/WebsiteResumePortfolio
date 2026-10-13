const API_ROOT = "https://api.cloudflare.com/client/v4";
const PROJECT_LIMIT = 100;
const MAX_REQUEST_BYTES = 24 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 18 * 1024 * 1024;
const MAX_FILES = 200;
const TEST_PROJECT_NAME = "sitecraft-test-site";

const json = (data, status) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

class HostingError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HostingError";
    this.status = status || 500;
  }
}

function contentTypeFor(path) {
  const ext = path.toLowerCase().split(".").pop();
  const types = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    webmanifest: "application/manifest+json",
    ico: "image/x-icon",
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    woff: "font/woff",
    woff2: "font/woff2"
  };
  return types[ext] || "application/octet-stream";
}

function validateFiles(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HostingError("files must be an object mapping relative paths to text content.", 400);
  }

  const entries = Object.entries(input);
  if (!entries.length) throw new HostingError("At least one website file is required.", 400);
  if (entries.length > MAX_FILES) throw new HostingError("Too many files for a website deployment.", 413);

  const encoder = new TextEncoder();
  let totalBytes = 0;
  const files = [];

  for (const entry of entries) {
    const path = entry[0];
    const content = entry[1];

    if (
      typeof path !== "string" ||
      !path ||
      path.startsWith("/") ||
      path.includes("\\") ||
      path.split("/").some(part => !part || part === "." || part === "..") ||
      !/^[a-zA-Z0-9._@/-]+$/.test(path)
    ) {
      throw new HostingError("A website file path is invalid.", 400);
    }

    if (typeof content !== "string") {
      throw new HostingError("Website files must be UTF-8 text in this test endpoint.", 400);
    }

    const bytes = encoder.encode(content);
    if (bytes.byteLength > 25 * 1024 * 1024) {
      throw new HostingError("A website file exceeds Cloudflare Pages' 25 MiB per-file limit.", 413);
    }

    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_TOTAL_FILE_BYTES) {
      throw new HostingError("Website package exceeds the 18 MiB deployment test limit. Reduce embedded image sizes and try again.", 413);
    }

    files.push({
      path,
      content,
      bytes,
      hash: null,
      mime: contentTypeFor(path)
    });
  }

  if (!files.some(file => file.path === "index.html")) {
    throw new HostingError("The website package must contain index.html.", 400);
  }

  return files;
}

async function cloudflareRequest(env, path, options) {
  const token = env.CLOUDFLARE_API_TOKEN;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new HostingError("Cloudflare hosting is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN as Worker variables/secrets.", 503);
  }

  const opts = options || {};
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);

  if (opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(API_ROOT + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body || undefined
    });
  } catch {
    throw new HostingError("Could not reach the Cloudflare API. Please retry.", 502);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new HostingError("Cloudflare returned an unreadable API response.", 502);
  }

  if (!response.ok || payload.success === false) {
    const details = Array.isArray(payload.errors)
      ? payload.errors.map(item => String(item.message || "")).filter(Boolean).join("; ")
      : "";
    throw new HostingError("Cloudflare API request failed" + (details ? ": " + details : "."), response.status >= 400 && response.status < 600 ? response.status : 502);
  }

  return payload;
}

async function listProjects(env) {
  const all = [];
  for (let page = 1; page <= 2; page++) {
    const result = await cloudflareRequest(
      env,
      "/accounts/" + encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID) + "/pages/projects?per_page=100&page=" + page
    );
    const projects = Array.isArray(result.result) ? result.result : [];
    all.push(...projects);
    if (projects.length < 100 || (result.result_info && page >= Number(result.result_info.total_pages || 1))) break;
  }
  return all;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes) {
  let binary = "";
  const step = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += step) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + step, bytes.length)));
  }
  return btoa(binary);
}

async function uploadAssets(projectName, files, env) {
  const accountId = encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID);
  const tokenResponse = await cloudflareRequest(
    env,
    "/accounts/" + accountId + "/pages/projects/" + encodeURIComponent(projectName) + "/upload-token"
  );
  const assetToken = tokenResponse.result && tokenResponse.result.jwt;
  if (!assetToken) throw new HostingError("Cloudflare did not return a Pages upload token.", 502);

  for (const file of files) file.hash = await sha256Hex(file.bytes);

  const missingResponse = await cloudflareRequest(env, "/pages/assets/check-missing", {
    method: "POST",
    headers: { "Authorization": "Bearer " + assetToken },
    body: JSON.stringify({ hashes: files.map(file => file.hash) })
  });
  const missing = new Set(Array.isArray(missingResponse.result) ? missingResponse.result : []);
  const toUpload = files.filter(file => missing.has(file.hash));

  for (let offset = 0; offset < toUpload.length;) {
    const batch = [];
    let batchBytes = 0;

    while (offset < toUpload.length && batch.length < 10) {
      const file = toUpload[offset];
      const estimatedBytes = Math.ceil(file.bytes.byteLength * 1.4) + 1024;
      if (batch.length && batchBytes + estimatedBytes > 3 * 1024 * 1024) break;
      batch.push(file);
      batchBytes += estimatedBytes;
      offset++;
    }

    const uploadBody = batch.map(file => ({
      base64: true,
      key: file.hash,
      metadata: { content_type: file.mime },
      value: toBase64(file.bytes)
    }));

    await cloudflareRequest(env, "/pages/assets/upload", {
      method: "POST",
      headers: { "Authorization": "Bearer " + assetToken },
      body: JSON.stringify(uploadBody)
    });
  }
}

async function deployAssets(env, projectName, files) {
  const manifest = {};
  for (const file of files) manifest[file.path] = file.hash;

  const form = new FormData();
  form.set("branch", "main");
  form.set("commit_dirty", "false");
  form.set("commit_message", "SiteCraft website deployment test");
  form.set("manifest", JSON.stringify(manifest));

  const result = await cloudflareRequest(
    env,
    "/accounts/" + encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID) +
      "/pages/projects/" + encodeURIComponent(projectName) + "/deployments",
    { method: "POST", body: form }
  );

  const deployment = result.result || {};
  const aliases = Array.isArray(deployment.aliases) ? deployment.aliases : [];
  const productionUrl = aliases.find(value => value === "https://" + projectName + ".pages.dev") ||
    "https://" + projectName + ".pages.dev";

  return {
    projectId: deployment.project_id || null,
    deploymentId: deployment.id || null,
    url: productionUrl,
    deploymentUrl: deployment.url || null,
    status: deployment.latest_stage && deployment.latest_stage.status || "submitted"
  };
}

async function deleteProject(env, projectName) {
  await cloudflareRequest(
    env,
    "/accounts/" + encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID) +
      "/pages/projects/" + encodeURIComponent(projectName),
    { method: "DELETE" }
  );
}

async function deployTestWebsite(env, files) {
  if (!env.DB) throw new HostingError("D1 binding DB is not configured.", 503);

  const previous = await env.DB.prepare(
    "SELECT id, project_name, cloudflare_project_id, hosting_url, status FROM hosting_deployments WHERE project_name = ?"
  ).bind(TEST_PROJECT_NAME).first();

  const projects = await listProjects(env);
  const existingCloudflareProject = projects.find(item => item.name === TEST_PROJECT_NAME);
  const accountMainName = String(env.SITECRAFT_MAIN_PROJECT_NAME || "").trim().toLowerCase();
  const mainAlreadyExists = accountMainName && projects.some(item => String(item.name || "").toLowerCase() === accountMainName);

  if (existingCloudflareProject && !previous) {
    throw new HostingError("A Cloudflare Pages project named sitecraft-test-site already exists but is not registered by this test. Rename or inspect it in Cloudflare before retrying.", 409);
  }

  if (!existingCloudflareProject) {
    const projectsUsedIncludingReservation = projects.length + (mainAlreadyExists ? 0 : 1);
    if (projectsUsedIncludingReservation >= PROJECT_LIMIT) {
      throw new HostingError("No free Cloudflare Pages project slot is available. The test reserves one slot for the SiteCraft main website and never exceeds the Free plan's 100-project cap.", 409);
    }

    await cloudflareRequest(env, "/accounts/" + encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID) + "/pages/projects", {
      method: "POST",
      body: JSON.stringify({ name: TEST_PROJECT_NAME, production_branch: "main" })
    });
  }

  let deployed;
  try {
    await uploadAssets(TEST_PROJECT_NAME, files, env);
    deployed = await deployAssets(env, TEST_PROJECT_NAME, files);
  } catch (error) {
    if (!existingCloudflareProject) {
      try { await deleteProject(env, TEST_PROJECT_NAME); } catch { /* Leave cleanup to the operator if Cloudflare rejects deletion. */ }
    }
    throw error;
  }

  const now = new Date().toISOString();
  const rowId = previous && previous.id || "hosting-test-site";
  await env.DB.prepare(
    "INSERT INTO hosting_deployments (id, template_id, project_name, cloudflare_project_id, hosting_url, status, deployment_type, created_at, updated_at) " +
    "VALUES (?, ?, ?, ?, ?, 'deployed', 'test', ?, ?) " +
    "ON CONFLICT(project_name) DO UPDATE SET cloudflare_project_id=excluded.cloudflare_project_id, hosting_url=excluded.hosting_url, status='deployed', updated_at=excluded.updated_at"
  ).bind(rowId, "test", TEST_PROJECT_NAME, deployed.projectId, deployed.url, now, now).run();

  return {
    ok: true,
    testOnly: true,
    projectName: TEST_PROJECT_NAME,
    url: deployed.url,
    deploymentUrl: deployed.deploymentUrl,
    status: deployed.status,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes.byteLength, 0),
    message: "Test deployment submitted. Verify the live Pages URL before enabling customer auto-hosting."
  };
}

export async function handlePagesHostingRoute(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/api/hosting/test-deploy") return null;

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  if (!env.HOSTING_TEST_TOKEN) {
    return json({ ok: false, error: "Hosting test is disabled until HOSTING_TEST_TOKEN is configured as a Worker secret." }, 503);
  }

  const provided = request.headers.get("X-Hosting-Test-Token") || "";
  if (provided.length !== env.HOSTING_TEST_TOKEN.length || provided !== env.HOSTING_TEST_TOKEN) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: "Could not read request body." }, 400);
  }

  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    return json({ ok: false, error: "Deployment request is too large.", limitBytes: MAX_REQUEST_BYTES }, 413);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  let files;
  try {
    files = validateFiles(body && body.files);
  } catch (error) {
    return json({ ok: false, error: error.message }, error.status || 400);
  }

  try {
    return json(await deployTestWebsite(env, files), 200);
  } catch (error) {
    const status = error instanceof HostingError ? error.status : 500;
    return json({
      ok: false,
      error: error instanceof HostingError ? error.message : "Cloudflare Pages deployment failed. Check Worker logs for details."
    }, status);
  }
}
