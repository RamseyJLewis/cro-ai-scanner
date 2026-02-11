/**
 * ============================================================
 *  AI A/B TEST IDEA GENERATOR — DOM Scanner + Adobe Hooks
 *  by Ramsey Lewis
 * 
 *  USAGE:
 *    Option A — Paste into DevTools console and press Enter
 *    Option B — Save as bookmarklet (see bottom of file)
 * 
 *  REQUIRES:
 *    - Claude API key set in the panel (stored in sessionStorage)
 *    - Works on any page; Adobe hooks activate automatically
 *      if Adobe Analytics / AEM / Target globals are detected
 * ============================================================
 */

(function () {
  "use strict";

  // ── Prevent duplicate injection ───────────────────────────
  if (document.getElementById("__abt_scanner_root")) {
    document.getElementById("__abt_scanner_root").style.display = "flex";
    return;
  }

  // ══════════════════════════════════════════════════════════
  //  CONFIG
  // ══════════════════════════════════════════════════════════
  const CFG = {
    modelId: "gpt-4o",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    sessionKey: "__abt_apikey",
    maxTokens: 2000,
    domDepthLimit: 6,
    domElementLimit: 300,
  };

  // ══════════════════════════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════════════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');

    #__abt_scanner_root * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Mono', monospace; }

    #__abt_scanner_root {
      position: fixed;
      top: 20px; right: 20px;
      width: 420px;
      max-height: 88vh;
      background: #0a0a0f;
      border: 1px solid #2a2a3a;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      z-index: 2147483647;
      box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(80,80,160,.2);
      overflow: hidden;
      resize: both;
      min-width: 320px;
      min-height: 200px;
      color: #e0e0f0;
      font-size: 12px;
    }

    #__abt_header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(135deg, #111128, #0f0f22);
      border-bottom: 1px solid #2a2a3a;
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }
    #__abt_header:active { cursor: grabbing; }

    #__abt_title {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: .04em;
      color: #fff;
      display: flex; align-items: center; gap: 8px;
    }
    #__abt_title span.dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #7c6aff;
      box-shadow: 0 0 8px #7c6aff;
      display: inline-block;
    }

    #__abt_controls { display: flex; gap: 6px; align-items: center; }
    .abt-icon-btn {
      background: none; border: 1px solid #333; border-radius: 6px;
      color: #888; cursor: pointer; padding: 4px 7px; font-size: 11px;
      transition: all .15s;
    }
    .abt-icon-btn:hover { border-color: #7c6aff; color: #7c6aff; }

    #__abt_body {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }

    /* API Key row */
    #__abt_apirow {
      display: flex; gap: 6px; align-items: center;
    }
    #__abt_apirow input {
      flex: 1;
      background: #111;
      border: 1px solid #2a2a3a;
      border-radius: 6px;
      color: #e0e0f0;
      padding: 6px 10px;
      font-size: 11px;
      font-family: 'DM Mono', monospace;
      outline: none;
      transition: border-color .15s;
    }
    #__abt_apirow input:focus { border-color: #7c6aff; }
    #__abt_apirow input::placeholder { color: #444; }

    /* Context selector */
    #__abt_context_section label {
      font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .08em;
      display: block; margin-bottom: 6px;
    }
    #__abt_context_grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    .ctx-chip {
      border: 1px solid #2a2a3a;
      border-radius: 6px;
      padding: 5px 4px;
      text-align: center;
      cursor: pointer;
      font-size: 10px;
      color: #888;
      transition: all .15s;
      background: #111;
    }
    .ctx-chip:hover { border-color: #7c6aff; color: #ddd; }
    .ctx-chip.active { border-color: #7c6aff; color: #fff; background: rgba(124,106,255,.15); }

    /* Adobe status */
    #__abt_adobe_bar {
      background: #0d0d1a;
      border: 1px solid #1a1a2e;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    #__abt_adobe_bar label {
      font-size: 10px; color: #555; text-transform: uppercase;
      letter-spacing: .08em; width: 100%; margin-bottom: 2px;
    }
    .adobe-badge {
      font-size: 10px;
      border-radius: 4px;
      padding: 3px 8px;
      border: 1px solid;
    }
    .adobe-badge.detected  { border-color: #4CAF50; color: #4CAF50; background: rgba(76,175,80,.1); }
    .adobe-badge.missing   { border-color: #333; color: #444; }

    /* Scan button */
    #__abt_scan_btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #7c6aff, #5248c7);
      border: none; border-radius: 8px;
      color: #fff; font-family: 'Syne', sans-serif;
      font-size: 13px; font-weight: 700;
      cursor: pointer;
      transition: all .2s;
      letter-spacing: .03em;
      position: relative;
      overflow: hidden;
    }
    #__abt_scan_btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,106,255,.4); }
    #__abt_scan_btn:active { transform: translateY(0); }
    #__abt_scan_btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
    #__abt_scan_btn .spinner {
      display: inline-block; width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: abt_spin .6s linear infinite;
      vertical-align: middle; margin-right: 6px;
    }
    @keyframes abt_spin { to { transform: rotate(360deg); } }

    /* Results */
    #__abt_results_section { display: none; flex-direction: column; gap: 10px; }
    #__abt_results_section.visible { display: flex; }

    .abt-divider {
      border: none; border-top: 1px solid #1e1e30; margin: 2px 0;
    }

    .abt-idea-card {
      background: #0d0d1a;
      border: 1px solid #1e1e30;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color .15s;
      animation: abt_fadein .3s ease both;
    }
    .abt-idea-card:hover { border-color: #3a3a5a; }
    @keyframes abt_fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .abt-idea-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .abt-idea-num {
      font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
      color: #7c6aff; flex-shrink: 0; margin-top: 1px;
    }
    .abt-idea-title {
      font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
      color: #e8e8ff; flex: 1;
    }
    .abt-priority {
      font-size: 9px; padding: 2px 7px; border-radius: 20px; flex-shrink: 0;
      font-family: 'DM Mono', monospace; font-weight: 500;
      text-transform: uppercase; letter-spacing: .05em;
    }
    .abt-priority.high  { background: rgba(255,107,107,.15); color: #ff6b6b; border: 1px solid rgba(255,107,107,.3); }
    .abt-priority.mid   { background: rgba(255,184,0,.1);  color: #ffb800; border: 1px solid rgba(255,184,0,.3); }
    .abt-priority.low   { background: rgba(124,106,255,.1); color: #9b8fff; border: 1px solid rgba(124,106,255,.3); }

    .abt-idea-hyp { font-size: 11px; color: #aaa; line-height: 1.5; }
    .abt-idea-meta {
      display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px;
    }
    .abt-tag {
      font-size: 9px; padding: 2px 7px; border-radius: 4px;
      background: #161625; border: 1px solid #2a2a3a; color: #666;
    }
    .abt-tag.type { color: #5fb8ff; border-color: rgba(95,184,255,.25); }
    .abt-tag.element { color: #7fffd4; border-color: rgba(127,255,212,.2); }
    .abt-tag.metric { color: #ffb86c; border-color: rgba(255,184,108,.2); }

    .abt-copy-btn {
      background: none; border: 1px solid #2a2a3a; border-radius: 5px;
      color: #555; cursor: pointer; font-size: 9px; padding: 2px 8px;
      font-family: 'DM Mono', monospace;
      transition: all .15s; align-self: flex-end;
    }
    .abt-copy-btn:hover { border-color: #7c6aff; color: #9b8fff; }

    /* DOM snapshot preview */
    #__abt_dom_preview {
      background: #080810;
      border: 1px solid #1a1a2e;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 10px;
      color: #445;
      max-height: 80px;
      overflow: hidden;
      white-space: pre;
      font-family: 'DM Mono', monospace;
      display: none;
    }

    /* Error */
    #__abt_error {
      background: rgba(255,80,80,.07);
      border: 1px solid rgba(255,80,80,.2);
      border-radius: 8px;
      padding: 10px 12px;
      color: #ff6b6b;
      font-size: 11px;
      line-height: 1.5;
      display: none;
    }

    #__abt_footer {
      padding: 8px 14px;
      border-top: 1px solid #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #333;
      flex-shrink: 0;
    }
    #__abt_footer a { color: #555; text-decoration: none; }
    #__abt_footer a:hover { color: #7c6aff; }
  `;

  // ══════════════════════════════════════════════════════════
  //  DOM SCANNER — builds structured snapshot of current page
  // ══════════════════════════════════════════════════════════
  function scanDOM() {
    const snapshot = {
      url: location.href,
      title: document.title,
      meta: {},
      aemComponents: [],
      forms: [],
      ctas: [],
      headlines: [],
      images: [],
      nav: [],
      priceElements: [],
      badges: [],
      adobeLayer: null,
      adobeAnalyticsVars: null,
      adobeTargetMboxes: [],
      rawStructure: "",
    };

    // Meta tags
    document.querySelectorAll("meta[name], meta[property]").forEach((m) => {
      const key = m.getAttribute("name") || m.getAttribute("property");
      snapshot.meta[key] = m.content;
    });

    // AEM component detection (data-cq-* and data-component attributes)
    document.querySelectorAll("[data-cq-component],[data-component],[data-sly-use],[class*='cmp-']").forEach((el) => {
      const type = el.getAttribute("data-cq-component") || el.getAttribute("data-component") ||
                   [...el.classList].find((c) => c.startsWith("cmp-")) || "unknown";
      snapshot.aemComponents.push({ type, text: el.innerText?.trim().slice(0, 80) });
    });

    // Adobe Data Layer (AEM Core Components standard)
    if (window.adobeDataLayer) {
      try {
        snapshot.adobeLayer = JSON.stringify(
          window.adobeDataLayer.getState ? window.adobeDataLayer.getState() : window.adobeDataLayer.slice(-3),
          null, 2
        ).slice(0, 1200);
      } catch (e) { snapshot.adobeLayer = "present but unreadable"; }
    }

    // Adobe Analytics (s object / digitalData)
    const s = window.s || window.s_gi;
    if (s || window.digitalData) {
      const src = s || window.digitalData;
      const keys = ["pageName","prop1","prop2","eVar1","eVar2","eVar3","eVar10","eVar20","eVar30","channel","server","events"];
      const found = {};
      keys.forEach((k) => { if (src[k]) found[k] = src[k]; });
      if (Object.keys(found).length) snapshot.adobeAnalyticsVars = found;
    }

    // Adobe Target mboxes
    if (window.adobe?.target) {
      try {
        document.querySelectorAll("[class*='mbox'],[id*='mbox']").forEach((el) => {
          snapshot.adobeTargetMboxes.push(el.id || el.className);
        });
      } catch (e) {}
    }

    // CTAs / Buttons
    document.querySelectorAll("a[href], button").forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length < 60) snapshot.ctas.push({ tag: el.tagName, text, href: el.href || null });
    });
    snapshot.ctas = snapshot.ctas.slice(0, 25);

    // Forms
    document.querySelectorAll("form").forEach((form) => {
      const fields = [...form.querySelectorAll("input,select,textarea")].map((f) => ({
        type: f.type || f.tagName, name: f.name, placeholder: f.placeholder,
      }));
      snapshot.forms.push({ action: form.action, fields });
    });

    // Headlines
    document.querySelectorAll("h1,h2,h3,[class*='hero'],[class*='headline'],[class*='title']").forEach((el) => {
      const text = el.innerText?.trim();
      if (text) snapshot.headlines.push({ tag: el.tagName, text: text.slice(0, 100) });
    });
    snapshot.headlines = snapshot.headlines.slice(0, 12);

    // Images with alt text
    document.querySelectorAll("img").forEach((img) => {
      snapshot.images.push({ src: img.src?.split("?")[0].slice(-60), alt: img.alt, w: img.naturalWidth });
    });
    snapshot.images = snapshot.images.filter((i) => i.w > 80).slice(0, 15);

    // Price / offer elements
    document.querySelectorAll("[class*='price'],[class*='rate'],[class*='offer'],[class*='deal'],[class*='discount']").forEach((el) => {
      const text = el.innerText?.trim();
      if (text) snapshot.priceElements.push(text.slice(0, 60));
    });
    snapshot.priceElements = [...new Set(snapshot.priceElements)].slice(0, 10);

    // Badges / labels
    document.querySelectorAll("[class*='badge'],[class*='label'],[class*='tag'],[class*='chip'],[class*='flag']").forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length < 30) snapshot.badges.push(text);
    });
    snapshot.badges = [...new Set(snapshot.badges)].slice(0, 10);

    // Simplified DOM structure for AI context
    function nodeToString(el, depth = 0) {
      if (depth > CFG.domDepthLimit) return "";
      const tag = el.tagName?.toLowerCase();
      if (!tag || ["script","style","svg","path","noscript"].includes(tag)) return "";
      const id = el.id ? `#${el.id}` : "";
      const cls = el.className && typeof el.className === "string"
        ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
      const text = el.children.length === 0 ? el.innerText?.trim().slice(0, 40) : "";
      return `${"  ".repeat(depth)}<${tag}${id}${cls}>${text ? " → " + text : ""}\n` +
        [...el.children].slice(0, 8).map((c) => nodeToString(c, depth + 1)).join("");
    }
    snapshot.rawStructure = nodeToString(document.body).slice(0, 3000);

    return snapshot;
  }

  // ══════════════════════════════════════════════════════════
  //  ADOBE DETECTION — checks what's live on page
  // ══════════════════════════════════════════════════════════
  function detectAdobe() {
    return {
      analytics: !!(window.s || window.s_gi || window.digitalData),
      launch: !!(window._satellite),
      target: !!(window.adobe?.target || window.mboxDefine),
      aem: !!(document.querySelector("[data-cq-component],[class*='cmp-']") || window.adobeDataLayer),
      dataLayer: !!(window.adobeDataLayer),
    };
  }

  // ══════════════════════════════════════════════════════════
  //  PROMPT BUILDER
  // ══════════════════════════════════════════════════════════
  function buildPrompt(snapshot, context, adobe) {
    const adobeSection = adobe.analytics || adobe.aem || adobe.target
      ? `\n## Adobe Stack Detected\n` +
        (snapshot.adobeAnalyticsVars ? `Analytics vars: ${JSON.stringify(snapshot.adobeAnalyticsVars)}\n` : "") +
        (snapshot.adobeLayer ? `AEM Data Layer (recent): ${snapshot.adobeLayer.slice(0,400)}\n` : "") +
        (snapshot.adobeTargetMboxes.length ? `Target mboxes: ${snapshot.adobeTargetMboxes.join(", ")}\n` : "")
      : "";

    const contextMap = {
      rental:    "This is a vehicle rental / fleet listing page. Focus on booking conversion.",
      ecommerce: "This is an e-commerce product/listing page. Focus on purchase conversion.",
      saas:      "This is a SaaS or B2B landing page. Focus on lead gen / sign-up.",
      content:   "This is a content / editorial page. Focus on engagement and scroll depth.",
      homepage:  "This is a homepage. Focus on user routing and first-impression clarity.",
      auto:      "Infer the page type from the DOM snapshot.",
    };

    return `You are a senior CRO strategist and A/B testing expert.

Analyze the following DOM snapshot and generate 6 high-quality A/B test ideas.

## Page Context
URL: ${snapshot.url}
Title: ${snapshot.title}
Context: ${contextMap[context] || contextMap.auto}
${adobeSection}

## Key Page Elements
Headlines: ${JSON.stringify(snapshot.headlines.map(h => h.text))}
CTAs: ${JSON.stringify(snapshot.ctas.map(c => c.text))}
Forms: ${JSON.stringify(snapshot.forms)}
Price/Rate elements: ${JSON.stringify(snapshot.priceElements)}
Badges/Labels: ${JSON.stringify(snapshot.badges)}
AEM Components: ${JSON.stringify(snapshot.aemComponents.slice(0,8))}
Images detected: ${snapshot.images.length}

## DOM Structure (abbreviated)
\`\`\`
${snapshot.rawStructure.slice(0, 2000)}
\`\`\`

## Instructions
Return EXACTLY this JSON format (no other text, no markdown code block):
{
  "ideas": [
    {
      "id": 1,
      "title": "Short test name",
      "priority": "high|mid|low",
      "type": "copy|layout|ux|personalization|social-proof|urgency|pricing",
      "element": "CSS selector or element description",
      "hypothesis": "If we [change X] then [metric Y] will improve because [reason Z]",
      "control": "Current state description",
      "variant": "Proposed change",
      "primary_metric": "Metric to measure",
      "secondary_metrics": ["metric2", "metric3"],
      "implementation_effort": "low|medium|high",
      "adobe_notes": "Any notes about leveraging Adobe Analytics/Target/AEM for this test (or null)"
    }
  ],
  "page_summary": "2-3 sentence CRO assessment of this page"
}

Prioritize tests that are: specific, measurable, and directly tied to conversion. Reference actual elements found in the DOM.`;
  }

  // ══════════════════════════════════════════════════════════
  //  API CALL
  // ══════════════════════════════════════════════════════════
  async function fetchIdeas(apiKey, prompt) {
    const res = await fetch(CFG.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CFG.modelId,
        max_tokens: CFG.maxTokens,
        messages: [
          {
            role: "system",
            content: "You are a senior CRO strategist and A/B testing expert. Always respond with valid JSON only — no markdown, no code fences, no explanations outside the JSON."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }

  // ══════════════════════════════════════════════════════════
  //  BUILD UI
  // ══════════════════════════════════════════════════════════
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "__abt_scanner_root";

  const adobe = detectAdobe();
  const ctxOptions = ["auto", "rental", "ecommerce", "saas", "content", "homepage"];

  root.innerHTML = `
    <div id="__abt_header">
      <div id="__abt_title">
        <span class="dot"></span> A/B TEST AI SCANNER
      </div>
      <div id="__abt_controls">
        <button class="abt-icon-btn" id="__abt_minimize">—</button>
        <button class="abt-icon-btn" id="__abt_close">✕</button>
      </div>
    </div>

    <div id="__abt_body">

      <!-- API Key -->
      <div id="__abt_apirow">
        <input id="__abt_apikey" type="password" placeholder="sk-proj-... (OpenAI API key)" />
        <button class="abt-icon-btn" id="__abt_save_key">Save</button>
      </div>

      <!-- Context -->
      <div id="__abt_context_section">
        <label>Page Context</label>
        <div id="__abt_context_grid">
          ${ctxOptions.map((c) => `<div class="ctx-chip${c === "auto" ? " active" : ""}" data-ctx="${c}">${c}</div>`).join("")}
        </div>
      </div>

      <!-- Adobe Status -->
      <div id="__abt_adobe_bar">
        <label>Adobe Stack</label>
        ${[
          ["Analytics", adobe.analytics],
          ["Launch", adobe.launch],
          ["Target", adobe.target],
          ["AEM", adobe.aem],
          ["Data Layer", adobe.dataLayer],
        ].map(([k, v]) => `<span class="adobe-badge ${v ? "detected" : "missing"}">${k}</span>`).join("")}
      </div>

      <!-- Scan -->
      <button id="__abt_scan_btn">⚡ Scan & Generate Ideas</button>

      <!-- Error -->
      <div id="__abt_error"></div>

      <!-- Results -->
      <div id="__abt_results_section">
        <hr class="abt-divider"/>
        <div id="__abt_page_summary"></div>
        <div id="__abt_ideas_container"></div>
        <div id="__abt_dom_preview"></div>
      </div>

    </div>

    <div id="__abt_footer">
      <span>GPT-4o Scanner v2.0 • RamseyJLewis</span>
      <a href="#" id="__abt_show_dom">View DOM snapshot</a>
    </div>
  `;

  document.body.appendChild(root);

  // ── Pre-load / restore API key ────────────────────────────
  const PRESET_KEY = "REPLACE WITH API KEY";
  const savedKey = sessionStorage.getItem(CFG.sessionKey) || PRESET_KEY;
  if (savedKey) {
    sessionStorage.setItem(CFG.sessionKey, savedKey);
    document.getElementById("__abt_apikey").value = savedKey;
  }

  // ── Wire up interactions ───────────────────────────────────
  let selectedCtx = "auto";
  let lastSnapshot = null;

  // Context chips
  root.querySelectorAll(".ctx-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      root.querySelectorAll(".ctx-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCtx = chip.dataset.ctx;
    });
  });

  // Save key
  document.getElementById("__abt_save_key").addEventListener("click", () => {
    const key = document.getElementById("__abt_apikey").value.trim();
    if (key) {
      sessionStorage.setItem(CFG.sessionKey, key);
      const btn = document.getElementById("__abt_save_key");
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = "Save"; }, 1500);
    }
  });

  // Close / minimize
  document.getElementById("__abt_close").addEventListener("click", () => { root.style.display = "none"; });
  document.getElementById("__abt_minimize").addEventListener("click", () => {
    const body = document.getElementById("__abt_body");
    const footer = document.getElementById("__abt_footer");
    const collapsed = body.style.display === "none";
    body.style.display = collapsed ? "" : "none";
    footer.style.display = collapsed ? "" : "none";
    root.style.height = collapsed ? "" : "auto";
  });

  // DOM preview toggle
  document.getElementById("__abt_show_dom").addEventListener("click", (e) => {
    e.preventDefault();
    const preview = document.getElementById("__abt_dom_preview");
    if (lastSnapshot) {
      preview.textContent = lastSnapshot.rawStructure;
      preview.style.display = preview.style.display === "none" ? "block" : "none";
    }
  });

  // Drag
  const header = document.getElementById("__abt_header");
  let dragging = false, dragX = 0, dragY = 0;
  header.addEventListener("mousedown", (e) => {
    dragging = true;
    dragX = e.clientX - root.offsetLeft;
    dragY = e.clientY - root.offsetTop;
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    root.style.right = "auto";
    root.style.left = (e.clientX - dragX) + "px";
    root.style.top  = (e.clientY - dragY) + "px";
  });
  document.addEventListener("mouseup", () => { dragging = false; });

  // ── MAIN SCAN HANDLER ──────────────────────────────────────
  document.getElementById("__abt_scan_btn").addEventListener("click", async () => {
    const apiKey = document.getElementById("__abt_apikey").value.trim();
    const errDiv  = document.getElementById("__abt_error");
    const results = document.getElementById("__abt_results_section");
    const scanBtn = document.getElementById("__abt_scan_btn");

    errDiv.style.display = "none";
    results.classList.remove("visible");

    if (!apiKey) {
      errDiv.textContent = "⚠️ Enter your Claude API key (sk-ant-…) above.";
      errDiv.style.display = "block";
      return;
    }

    scanBtn.disabled = true;
    scanBtn.innerHTML = `<span class="spinner"></span> Scanning DOM…`;

    try {
      const snapshot = scanDOM();
      lastSnapshot = snapshot;
      const prompt = buildPrompt(snapshot, selectedCtx, adobe);

      scanBtn.innerHTML = `<span class="spinner"></span> Generating ideas…`;
      const parsed = await fetchIdeas(apiKey, prompt);

      // Render page summary
      document.getElementById("__abt_page_summary").innerHTML =
        `<div style="font-size:11px;color:#888;line-height:1.6;padding:4px 0 6px">
          <span style="color:#7c6aff;font-family:Syne,sans-serif;font-size:11px;font-weight:700">PAGE ASSESSMENT</span><br>
          ${parsed.page_summary || ""}
        </div>`;

      // Render idea cards
      const container = document.getElementById("__abt_ideas_container");
      container.innerHTML = "";
      (parsed.ideas || []).forEach((idea, i) => {
        const card = document.createElement("div");
        card.className = "abt-idea-card";
        card.style.animationDelay = `${i * 60}ms`;
        card.innerHTML = `
          <div class="abt-idea-header">
            <span class="abt-idea-num">TEST ${String(idea.id || i+1).padStart(2,"0")}</span>
            <span class="abt-idea-title">${idea.title}</span>
            <span class="abt-priority ${idea.priority === "high" ? "high" : idea.priority === "mid" ? "mid" : "low"}">${idea.priority}</span>
          </div>
          <div class="abt-idea-hyp">${idea.hypothesis}</div>
          <div style="font-size:10px;color:#555;margin-top:2px">
            <span style="color:#444">CTRL:</span> ${idea.control}<br>
            <span style="color:#444">VAR :</span> <span style="color:#c8c8ff">${idea.variant}</span>
          </div>
          ${idea.adobe_notes ? `<div style="font-size:10px;color:#6a8fa8;margin-top:2px">🔷 ${idea.adobe_notes}</div>` : ""}
          <div class="abt-idea-meta">
            <span class="abt-tag type">${idea.type}</span>
            <span class="abt-tag element">${idea.element}</span>
            <span class="abt-tag metric">📊 ${idea.primary_metric}</span>
            <span class="abt-tag">effort: ${idea.implementation_effort}</span>
          </div>
          <button class="abt-copy-btn" data-idx="${i}">copy</button>
        `;
        container.appendChild(card);
      });

      // Copy buttons
      container.querySelectorAll(".abt-copy-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idea = parsed.ideas[+btn.dataset.idx];
          navigator.clipboard.writeText(JSON.stringify(idea, null, 2));
          btn.textContent = "copied!";
          setTimeout(() => { btn.textContent = "copy"; }, 1500);
        });
      });

      results.classList.add("visible");
      scanBtn.innerHTML = "↺ Re-scan Page";

    } catch (err) {
      errDiv.textContent = `❌ ${err.message}`;
      errDiv.style.display = "block";
      scanBtn.innerHTML = "⚡ Scan & Generate Ideas";
    }

    scanBtn.disabled = false;
  });

  console.log("%c✓ A/B Test Scanner injected — panel is top-right.", "color:#7c6aff;font-weight:bold;");
  console.log("%cTo dismiss: document.getElementById('__abt_scanner_root').style.display='none'", "color:#555");

  /* ──────────────────────────────────────────────────────────
     BOOKMARKLET VERSION
     Save this as a browser bookmark with the URL:

     javascript:(function(){const s=document.createElement('script');s.src='https://YOUR_CDN/ab-test-scanner.js';document.head.appendChild(s);})();

     Or self-contained (minify this file and wrap in the
     javascript:void(function(){...}()); pattern)
   ────────────────────────────────────────────────────────── */
})();
