/**
 * ============================================================
 *  LiftLab.Ideate — AI A/B Test Idea Generator
 *  DOM Scanner + Adobe Hooks
 *  by Ramsey Lewis  ·  ramseyjlewis.com  ·  v2.0
 *
 *  USAGE:
 *    Option A — Paste into DevTools console and press Enter
 *    Option B — Save as bookmarklet (see bottom of file)
 *
 *  REQUIRES:
 *    - OpenAI API key set in the panel (stored in sessionStorage)
 *    - Adobe hooks activate automatically if globals are detected
 * ============================================================
 */

(function () {
  "use strict";

  if (document.getElementById("__rl_ide_host")) {
    const h = document.getElementById("__rl_ide_host");
    h.style.display = h.style.display === "none" ? "block" : "none";
    return;
  }

  // ══════════════════════════════════════════════════════════
  //  CONFIG
  // ══════════════════════════════════════════════════════════
  const CFG = {
    modelId: "gpt-4o",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    sessionKey: "__rl_ide_apikey",
    maxTokens: 2000,
    domDepthLimit: 6,
  };

  // ══════════════════════════════════════════════════════════
  //  CSS — ramseyjlewis.com design system
  // ══════════════════════════════════════════════════════════
  const css = `
    *, *::before, *::after {
      box-sizing: border-box; margin: 0; padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    #__rlide_root {
      --bg-base:       #080e1a;
      --bg-panel:      #0d1520;
      --bg-card:       #111c2d;
      --bg-card-hover: #152035;
      --bg-input:      #0a1222;
      --border:        #1a2840;
      --border-active: #00d4c8;
      --teal:          #00d4c8;
      --teal-dim:      rgba(0,212,200,0.10);
      --teal-glow:     rgba(0,212,200,0.22);
      --teal-border:   rgba(0,212,200,0.28);
      --white:         rgba(255,255,255,0.92);
      --white-mid:     rgba(255,255,255,0.55);
      --white-dim:     rgba(255,255,255,0.30);
      --white-faint:   rgba(255,255,255,0.12);
      --red:           #ff4d6a;
      --red-bg:        rgba(255,77,106,0.10);
      --red-border:    rgba(255,77,106,0.25);
      --orange:        #ff9f40;
      --orange-bg:     rgba(255,159,64,0.10);
      --orange-border: rgba(255,159,64,0.25);
      --blue:          #4d8fff;
      --blue-bg:       rgba(77,143,255,0.10);
      --blue-border:   rgba(77,143,255,0.25);
      --purple:        #a78bfa;
      --purple-bg:     rgba(167,139,250,0.10);
      --green:         #34d399;
      --green-bg:      rgba(52,211,153,0.10);
      --green-border:  rgba(52,211,153,0.25);
      --radius-xs: 4px; --radius-sm: 6px; --radius-md: 8px;
      --radius-lg: 10px; --radius-xl: 12px;
      --t: 0.15s ease;

      position: relative; width: 100%; max-height: 90vh;
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      display: flex; flex-direction: column;
      box-shadow:
        0 0 0 1px rgba(0,212,200,0.05),
        0 4px 6px rgba(0,0,0,0.4),
        0 24px 60px rgba(0,0,0,0.65),
        0 0 80px rgba(0,212,200,0.04);
      overflow: hidden; min-width: 400px; min-height: 220px;
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      font-size: 13px; color: var(--white);
    }

    /* ── HEADER ── */
    #__rlide_header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px; border-bottom: 1px solid var(--border);
      cursor: grab; user-select: none; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(0,212,200,0.04) 0%, transparent 60%);
    }
    #__rlide_header:active { cursor: grabbing; }
    .rl-header-left { display: flex; flex-direction: column; gap: 3px; }
    .rl-wordmark {
      font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
      color: var(--white); text-transform: uppercase;
    }
    .rl-wordmark span { color: var(--teal); }
    .rl-subtitle {
      font-size: 10px; font-weight: 500; color: var(--white-dim);
      letter-spacing: 0.08em; text-transform: uppercase;
    }
    .rl-header-right { display: flex; gap: 8px; align-items: center; }
    .rl-icon-btn {
      width: 28px; height: 28px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg-card);
      color: var(--white-dim); font-size: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--t); font-family: inherit;
    }
    .rl-icon-btn:hover { border-color: var(--teal-border); color: var(--teal); background: var(--teal-dim); }
    .rl-icon-btn.danger:hover { border-color: var(--red-border); color: var(--red); background: var(--red-bg); }

    /* ── BODY ── */
    #__rlide_body {
      flex: 1; overflow-y: auto; padding: 16px 18px 18px;
      display: flex; flex-direction: column; gap: 14px;
      scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    }
    #__rlide_body::-webkit-scrollbar { width: 3px; }
    #__rlide_body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    /* ── SECTION LABEL ── */
    .rl-section-hd {
      font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--teal); margin-bottom: 8px;
      display: flex; align-items: center; gap: 8px;
    }
    .rl-section-hd::after { content:''; flex:1; height:1px; background:var(--border); }

    /* ── API KEY ── */
    .rl-input-row { display: flex; gap: 8px; align-items: center; }
    .rl-input {
      flex: 1; height: 36px; padding: 0 12px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: var(--radius-md); color: var(--white);
      font-family: inherit; font-size: 12px; outline: none;
      transition: border-color var(--t), box-shadow var(--t);
    }
    .rl-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(0,212,200,0.12); }
    .rl-input::placeholder { color: var(--white-faint); }
    .rl-btn-sm {
      height: 36px; padding: 0 14px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-md); color: var(--white-mid);
      font-family: inherit; font-size: 12px; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: all var(--t);
    }
    .rl-btn-sm:hover { border-color: var(--teal-border); color: var(--teal); background: var(--teal-dim); }

    /* ── CONTEXT CHIPS ── */
    .rl-chip-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
    .rl-ctx-chip {
      height: 30px; display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      border-left: 2px solid transparent;
      cursor: pointer; font-size: 11px; font-weight: 500; color: var(--white-dim);
      background: var(--bg-card); transition: all var(--t); font-family: inherit;
    }
    .rl-ctx-chip:hover { border-color: var(--teal-border); color: var(--white-mid); background: var(--bg-card-hover); }
    .rl-ctx-chip.active { border-color: var(--teal-border); border-left-color: var(--teal); color: var(--teal); background: var(--teal-dim); }

    /* ── ADOBE STATUS ── */
    .rl-adobe-bar {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 12px 14px;
    }
    .rl-adobe-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .adobe-badge {
      height: 20px; padding: 0 8px; display: inline-flex; align-items: center;
      font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
      border-radius: var(--radius-xs); border: 1px solid; text-transform: uppercase;
    }
    .adobe-badge.detected { border-color: var(--green-border); color: var(--green); background: var(--green-bg); }
    .adobe-badge.missing  { border-color: var(--border); color: var(--white-faint); background: transparent; }

    /* ── CREATIVITY TUNER ── */
    .rl-creativity-box {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 12px 14px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .rl-creativity-head { display: flex; align-items: center; justify-content: space-between; }
    .rl-creativity-mode-label { font-size: 11px; font-weight: 600; color: var(--teal); }

    .rl-seg-track {
      display: grid; grid-template-columns: repeat(3,1fr); gap: 2px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 2px;
    }
    .rl-seg {
      height: 28px; border: none; border-radius: var(--radius-sm);
      font-family: inherit; font-size: 11px; font-weight: 600;
      cursor: pointer; color: var(--white-dim); background: transparent;
      transition: all var(--t); letter-spacing: 0.02em;
    }
    .rl-seg:hover:not(.active) { color: var(--white-mid); }
    .rl-seg.active.mode-0 { background: var(--blue-bg); color: var(--blue); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    .rl-seg.active.mode-1 { background: var(--teal-dim); color: var(--teal); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    .rl-seg.active.mode-2 { background: var(--orange-bg); color: var(--orange); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

    .rl-temp-bar { display: flex; align-items: center; gap: 5px; }
    .rl-temp-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--border);
      transition: background var(--t), box-shadow var(--t), transform var(--t);
    }
    .rl-temp-dot.lit-0 { background: var(--blue); box-shadow: 0 0 6px rgba(77,143,255,0.7); transform: scale(1.1); }
    .rl-temp-dot.lit-1 { background: var(--teal); box-shadow: 0 0 6px var(--teal-glow); transform: scale(1.1); }
    .rl-temp-dot.lit-2 { background: var(--orange); box-shadow: 0 0 6px rgba(255,159,64,0.7); transform: scale(1.1); }
    .rl-temp-label { font-size: 10px; color: var(--white-faint); margin-left: 4px; font-variant-numeric: tabular-nums; }
    .rl-creativity-desc { font-size: 11px; color: var(--white-dim); line-height: 1.5; }

    /* ── YOUR DATA DRAWER ── */
    .rl-drawer-toggle {
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; padding: 10px 14px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); border-left: 2px solid transparent;
      transition: all var(--t); user-select: none;
    }
    .rl-drawer-toggle:hover { border-color: var(--teal-border); border-left-color: var(--teal); background: var(--bg-card-hover); }
    .rl-drawer-toggle.open { border-color: var(--teal-border); border-left-color: var(--teal); border-radius: var(--radius-lg) var(--radius-lg) 0 0; border-bottom-color: transparent; }
    .rl-drawer-left { display: flex; align-items: center; gap: 8px; }
    .rl-drawer-label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--white-dim); }
    .rl-ctx-badge {
      display: none; height: 17px; min-width: 17px; padding: 0 4px;
      border-radius: 9px; background: var(--teal); color: #000;
      font-size: 9px; font-weight: 800; align-items: center; justify-content: center;
    }
    .rl-ctx-badge.visible { display: flex; }
    .rl-drawer-chev { font-size: 11px; color: var(--white-faint); transition: transform var(--t); }
    .rl-drawer-toggle.open .rl-drawer-chev { transform: rotate(180deg); }

    .rl-drawer-body {
      background: var(--bg-card); border: 1px solid var(--teal-border); border-top: none;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      padding: 0 14px; max-height: 0; overflow: hidden;
      transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1), padding 0.28s cubic-bezier(0.4,0,0.2,1);
    }
    .rl-drawer-body.open { max-height: 420px; padding: 12px 14px 14px; }

    .rl-inner-tabs {
      display: flex; gap: 2px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 2px; margin-bottom: 10px;
    }
    .rl-inner-tab {
      flex: 1; height: 26px; border: none; border-radius: var(--radius-sm);
      font-family: inherit; font-size: 11px; font-weight: 600;
      cursor: pointer; color: var(--white-dim); background: transparent; transition: all var(--t);
    }
    .rl-inner-tab:hover:not(.active) { color: var(--white-mid); }
    .rl-inner-tab.active { background: var(--teal-dim); color: var(--teal); border: 1px solid var(--teal-border); }

    .rl-inner-panel { display: none; flex-direction: column; gap: 8px; }
    .rl-inner-panel.active { display: flex; }

    .rl-textarea {
      width: 100%; height: 100px; padding: 10px 12px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: var(--radius-md); color: var(--white);
      font-family: inherit; font-size: 12px; outline: none; resize: none; line-height: 1.55;
      transition: border-color var(--t), box-shadow var(--t);
    }
    .rl-textarea:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(0,212,200,0.12); }
    .rl-textarea::placeholder { color: var(--white-faint); }

    .rl-helper { font-size: 10px; color: var(--white-faint); line-height: 1.5; }
    .rl-helper-row { display: flex; align-items: center; justify-content: space-between; }
    .rl-clear-sm {
      height: 22px; padding: 0 9px; background: transparent;
      border: 1px solid var(--border); border-radius: var(--radius-xs);
      color: var(--white-faint); font-family: inherit; font-size: 10px; font-weight: 500;
      cursor: pointer; transition: all var(--t);
    }
    .rl-clear-sm:hover { border-color: var(--red-border); color: var(--red); }

    #__rlide_url_status {
      font-size: 11px; display: none; align-items: center; gap: 6px;
      padding: 7px 10px; border-radius: var(--radius-sm); border: 1px solid;
    }
    #__rlide_url_status.loading { display:flex; color:var(--white-dim); border-color:var(--border); background:var(--bg-input); }
    #__rlide_url_status.success { display:flex; color:var(--green); border-color:var(--green-border); background:var(--green-bg); }
    #__rlide_url_status.error   { display:flex; color:var(--red); border-color:var(--red-border); background:var(--red-bg); }
    .url-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
    #__rlide_url_status.loading .url-dot { background:var(--white-faint); animation:rl_pulse 1.2s ease-in-out infinite; }
    #__rlide_url_status.success .url-dot { background:var(--green); }
    #__rlide_url_status.error   .url-dot { background:var(--red); }
    @keyframes rl_pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

    /* ── SCAN BUTTON ── */
    #__rlide_scan_btn {
      width: 100%; height: 40px;
      background: var(--teal-dim); border: 1px solid var(--teal-border);
      border-radius: var(--radius-lg); color: var(--teal);
      font-family: inherit; font-size: 14px; font-weight: 700;
      letter-spacing: 0.04em; cursor: pointer; transition: all var(--t);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    #__rlide_scan_btn:hover {
      background: var(--teal-glow);
      box-shadow: 0 0 24px var(--teal-glow);
      color: #fff;
    }
    #__rlide_scan_btn:active { opacity: 0.75; }
    #__rlide_scan_btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
    #__rlide_scan_btn.mode-warm {
      background: var(--orange-bg); border-color: var(--orange-border); color: var(--orange);
    }
    #__rlide_scan_btn.mode-warm:hover { box-shadow: 0 0 24px rgba(255,159,64,0.25); color: #fff; }

    .rl-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(0,212,200,0.25); border-top-color: var(--teal);
      border-radius: 50%; animation: rl_spin 0.65s linear infinite; flex-shrink: 0;
    }
    @keyframes rl_spin { to { transform: rotate(360deg); } }

    /* ── ERROR ── */
    #__rlide_error {
      background: var(--red-bg); border: 1px solid var(--red-border);
      border-radius: var(--radius-lg); padding: 11px 14px;
      color: var(--red); font-size: 12px; line-height: 1.55; display: none;
    }

    /* ── RESULTS ── */
    #__rlide_results { display: none; flex-direction: column; gap: 12px; }
    #__rlide_results.visible { display: flex; }
    .rl-divider { border: none; border-top: 1px solid var(--border); }

    /* Page summary */
    #__rlide_summary {
      background: var(--bg-card); border: 1px solid var(--border);
      border-left: 3px solid var(--teal);
      border-radius: var(--radius-lg); padding: 14px 16px;
    }
    .sum-eyebrow {
      font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--teal); margin-bottom: 7px;
    }
    .sum-text { font-size: 12px; color: var(--white-mid); line-height: 1.65; }

    /* ── IDEA CARDS ── */
    .rl-idea-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-left: 3px solid transparent;
      border-radius: var(--radius-lg);
      padding: 14px 16px 12px;
      display: flex; flex-direction: column; gap: 0;
      transition: all var(--t);
      animation: rl_fadein 0.3s ease both;
    }
    .rl-idea-card:hover { border-color: var(--teal-border); border-left-color: var(--teal); background: var(--bg-card-hover); }
    .rl-idea-card.prio-high { border-left-color: var(--red); }
    .rl-idea-card.prio-high:hover { border-color: rgba(255,77,106,0.3); border-left-color: var(--red); }
    .rl-idea-card.prio-mid  { border-left-color: var(--orange); }
    .rl-idea-card.prio-mid:hover { border-color: rgba(255,159,64,0.3); border-left-color: var(--orange); }
    @keyframes rl_fadein { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:none} }

    .rl-card-top { display: flex; align-items: center; gap: 10px; }
    .rl-idea-num {
      font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
      color: var(--white-faint); flex-shrink: 0;
    }
    .rl-idea-title { font-size: 13px; font-weight: 600; color: var(--white); line-height: 1.25; flex: 1; }

    .rl-prio {
      flex-shrink: 0; height: 18px; padding: 0 7px;
      border-radius: var(--radius-xs); border: 1px solid;
      font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; display: flex; align-items: center;
    }
    .rl-prio.high { color: var(--red);    border-color: var(--red-border);    background: var(--red-bg); }
    .rl-prio.mid  { color: var(--orange); border-color: var(--orange-border); background: var(--orange-bg); }
    .rl-prio.low  { color: var(--teal);   border-color: var(--teal-border);   background: var(--teal-dim); }

    .rl-idea-hyp {
      margin-top: 9px; font-size: 12px; color: var(--white-mid); line-height: 1.6;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .rl-idea-card:hover .rl-idea-hyp { -webkit-line-clamp: 6; }

    /* Details */
    .rl-details {
      margin-top: 10px; background: var(--bg-base);
      border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;
    }
    .rl-details > summary {
      list-style: none; cursor: pointer; padding: 9px 12px;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      color: var(--white-dim); font-size: 11px; user-select: none;
      transition: color var(--t);
    }
    .rl-details > summary:hover { color: var(--white-mid); }
    .rl-details > summary::-webkit-details-marker { display: none; }
    .rl-details .sum-left { display: flex; align-items: center; gap: 8px; }
    .rl-details .sum-pill {
      font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 2px 6px; border-radius: 999px;
      border: 1px solid var(--border); color: var(--white-faint); background: var(--bg-card);
    }
    .rl-details .chev { opacity: 0.4; transition: transform 0.16s ease; }
    .rl-details[open] .chev { transform: rotate(180deg); }
    .rl-details-body {
      border-top: 1px solid var(--border); padding: 10px 12px 12px;
      display: flex; flex-direction: column; gap: 8px;
    }

    /* CV rows */
    .rl-cv-row {
      display: flex; align-items: baseline; gap: 10px;
      padding: 10px; border-radius: var(--radius-md);
      background: var(--bg-card); border: 1px solid var(--border);
      font-size: 12px; line-height: 1.55;
    }
    .rl-cv-row + .rl-cv-row { margin-top: 5px; }
    .cv-pill {
      flex-shrink: 0; font-size: 9px; font-weight: 700; letter-spacing: 0.07em;
      text-transform: uppercase; border-radius: var(--radius-xs); padding: 2px 6px; margin-top: 2px;
      min-width: 32px; text-align: center;
    }
    .cv-pill.ctrl { color: var(--white-dim); background: var(--bg-input); border: 1px solid var(--border); }
    .cv-pill.var  { color: var(--teal);     background: var(--teal-dim); border: 1px solid var(--teal-border); }
    .cv-text-ctrl {
      color: var(--white-dim); font-weight: 400;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .cv-text-var {
      color: var(--white); font-weight: 400;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }

    /* Adobe note */
    .rl-adobe-note {
      display: flex; align-items: flex-start; gap: 8px;
      background: var(--teal-dim); border: 1px solid var(--teal-border);
      border-radius: var(--radius-sm); padding: 9px 12px;
      font-size: 11px; color: var(--teal); line-height: 1.6;
    }
    .rl-adobe-note .note-icon { flex-shrink: 0; margin-top: 2px; opacity: 0.7; }

    /* Card footer */
    .rl-card-footer {
      margin-top: 10px; display: grid; grid-template-columns: 1fr auto;
      align-items: center; gap: 10px;
    }
    .rl-tags { display: flex; flex-wrap: nowrap; overflow: hidden; gap: 5px; min-width: 0; }
    .rl-tag {
      height: 18px; padding: 0 7px; display: inline-flex; align-items: center;
      font-size: 9px; font-weight: 600; border-radius: var(--radius-xs); border: 1px solid;
      text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; flex: 0 0 auto;
    }
    .rl-tag.type    { color: var(--purple); border-color: rgba(167,139,250,0.25); background: var(--purple-bg); }
    .rl-tag.element {
      color: var(--teal); border-color: var(--teal-border); background: var(--teal-dim);
      max-width: 130px; overflow: hidden; text-overflow: ellipsis;
      font-family: 'SF Mono', Menlo, monospace; font-size: 9px;
    }
    .rl-tag.metric  {
      color: var(--orange); border-color: var(--orange-border); background: var(--orange-bg);
      max-width: 120px; overflow: hidden; text-overflow: ellipsis;
    }
    .rl-tag.effort  { color: var(--white-faint); border-color: var(--border); background: transparent; }

    .rl-copy-btn {
      flex-shrink: 0; height: 24px; padding: 0 10px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: var(--radius-sm); color: var(--white-dim);
      font-family: inherit; font-size: 10px; font-weight: 600; cursor: pointer;
      transition: all var(--t); display: flex; align-items: center; gap: 4px;
    }
    .rl-copy-btn:hover { background: var(--teal-dim); border-color: var(--teal-border); color: var(--teal); }
    .rl-copy-btn:active { opacity: 0.6; }

    /* DOM preview */
    #__rlide_dom_preview {
      background: var(--bg-base); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 10px 12px;
      font-size: 10px; font-family: 'SF Mono', Menlo, monospace;
      color: rgba(0,212,200,0.6); max-height: 120px; overflow: hidden;
      white-space: pre; display: none;
    }

    /* ── FOOTER ── */
    #__rlide_footer {
      padding: 9px 18px; border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      font-size: 10px; color: var(--white-faint); flex-shrink: 0;
      background: var(--bg-base);
    }
    .rl-footer-brand { font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .rl-footer-brand span { color: var(--teal); }
    #__rlide_footer a { color: var(--white-faint); text-decoration: none; transition: color var(--t); }
    #__rlide_footer a:hover { color: var(--teal); }
  `;

  // ══════════════════════════════════════════════════════════
  //  CREATIVITY CONFIG
  // ══════════════════════════════════════════════════════════
  const CREATIVITY_MODES = [
    {
      label: "Conservative", temperature: 0.3,
      desc: "Proven, low-risk patterns with documented lift.",
      persona: "Focus only on well-established, low-risk CRO patterns with strong documented conversion lift. No experimental ideas. Prioritize quick wins and high-confidence tests.",
    },
    {
      label: "Balanced", temperature: 0.7,
      desc: "Mix of proven tactics and moderate innovation.",
      persona: "Balance proven CRO tactics with moderate innovation. Reference industry benchmarks where possible. Include both safe wins and a few more creative hypotheses.",
    },
    {
      label: "Experimental", temperature: 1.1,
      desc: "Counter-intuitive ideas driven by behavioral psychology.",
      persona: "Push boundaries. Include at least 2 unconventional or counter-intuitive test ideas that challenge assumptions about user behavior. Think behavioral psychology, cognitive biases, and interaction patterns — not just UI tweaks. Be bold.",
    },
  ];

  // ══════════════════════════════════════════════════════════
  //  DOM SCANNER  (unchanged logic)
  // ══════════════════════════════════════════════════════════
  function scanDOM() {
    const snapshot = { url:location.href, title:document.title, meta:{}, aemComponents:[], forms:[], ctas:[], headlines:[], images:[], priceElements:[], badges:[], adobeLayer:null, adobeAnalyticsVars:null, adobeTargetMboxes:[], rawStructure:"" };
    document.querySelectorAll("meta[name],meta[property]").forEach(m=>{ snapshot.meta[m.getAttribute("name")||m.getAttribute("property")]=m.content; });
    document.querySelectorAll("[data-cq-component],[data-component],[data-sly-use],[class*='cmp-']").forEach(el=>{ const type=el.getAttribute("data-cq-component")||el.getAttribute("data-component")||[...el.classList].find(c=>c.startsWith("cmp-"))||"unknown"; snapshot.aemComponents.push({type,text:el.innerText?.trim().slice(0,80)}); });
    if (window.adobeDataLayer) { try { snapshot.adobeLayer=JSON.stringify(window.adobeDataLayer.getState?window.adobeDataLayer.getState():window.adobeDataLayer.slice(-3),null,2).slice(0,1200); } catch(e){snapshot.adobeLayer="present but unreadable";} }
    const s=window.s||window.s_gi; if(s||window.digitalData){const src=s||window.digitalData;const keys=["pageName","prop1","prop2","eVar1","eVar2","eVar3","eVar10","eVar20","eVar30","channel","server","events"];const found={};keys.forEach(k=>{if(src[k])found[k]=src[k];});if(Object.keys(found).length)snapshot.adobeAnalyticsVars=found;}
    if(window.adobe?.target){try{document.querySelectorAll("[class*='mbox'],[id*='mbox']").forEach(el=>{snapshot.adobeTargetMboxes.push(el.id||el.className);});}catch(e){}}
    document.querySelectorAll("a[href],button").forEach(el=>{const text=el.innerText?.trim();if(text&&text.length<60)snapshot.ctas.push({tag:el.tagName,text,href:el.href||null});}); snapshot.ctas=snapshot.ctas.slice(0,25);
    document.querySelectorAll("form").forEach(form=>{const fields=[...form.querySelectorAll("input,select,textarea")].map(f=>({type:f.type||f.tagName,name:f.name,placeholder:f.placeholder}));snapshot.forms.push({action:form.action,fields});});
    document.querySelectorAll("h1,h2,h3,[class*='hero'],[class*='headline'],[class*='title']").forEach(el=>{const text=el.innerText?.trim();if(text)snapshot.headlines.push({tag:el.tagName,text:text.slice(0,100)});}); snapshot.headlines=snapshot.headlines.slice(0,12);
    document.querySelectorAll("img").forEach(img=>{snapshot.images.push({src:img.src?.split("?")[0].slice(-60),alt:img.alt,w:img.naturalWidth});}); snapshot.images=snapshot.images.filter(i=>i.w>80).slice(0,15);
    document.querySelectorAll("[class*='price'],[class*='rate'],[class*='offer'],[class*='deal'],[class*='discount']").forEach(el=>{const text=el.innerText?.trim();if(text)snapshot.priceElements.push(text.slice(0,60));}); snapshot.priceElements=[...new Set(snapshot.priceElements)].slice(0,10);
    document.querySelectorAll("[class*='badge'],[class*='label'],[class*='tag'],[class*='chip'],[class*='flag']").forEach(el=>{const text=el.innerText?.trim();if(text&&text.length<30)snapshot.badges.push(text);}); snapshot.badges=[...new Set(snapshot.badges)].slice(0,10);
    function nodeToString(el,depth=0){if(depth>CFG.domDepthLimit)return"";const tag=el.tagName?.toLowerCase();if(!tag||["script","style","svg","path","noscript"].includes(tag))return"";const id=el.id?`#${el.id}`:"";const cls=el.className&&typeof el.className==="string"?"."+el.className.trim().split(/\s+/).slice(0,3).join("."):"";const text=el.children.length===0?el.innerText?.trim().slice(0,40):"";return`${"  ".repeat(depth)}<${tag}${id}${cls}>${text?" → "+text:""}\n`+[...el.children].slice(0,8).map(c=>nodeToString(c,depth+1)).join("");}
    snapshot.rawStructure=nodeToString(document.body).slice(0,3000);
    return snapshot;
  }

  function detectAdobe() {
    return { analytics:!!(window.s||window.s_gi||window.digitalData), launch:!!(window._satellite), target:!!(window.adobe?.target||window.mboxDefine), aem:!!(document.querySelector("[data-cq-component],[class*='cmp-']")||window.adobeDataLayer), dataLayer:!!(window.adobeDataLayer) };
  }

  function buildPrompt(snapshot,context,adobe,creativityMode,userContext) {
    const adobeSection=adobe.analytics||adobe.aem||adobe.target?`\n## Adobe Stack Detected\n`+(snapshot.adobeAnalyticsVars?`Analytics vars: ${JSON.stringify(snapshot.adobeAnalyticsVars)}\n`:"")+( snapshot.adobeLayer?`AEM Data Layer: ${snapshot.adobeLayer.slice(0,400)}\n`:"")+( snapshot.adobeTargetMboxes.length?`Target mboxes: ${snapshot.adobeTargetMboxes.join(", ")}\n`:""):"";
    const contextMap={rental:"Vehicle rental/fleet listing page. Focus on booking conversion.",ecommerce:"E-commerce product/listing page. Focus on purchase conversion.",saas:"SaaS or B2B landing page. Focus on lead gen / sign-up.",content:"Content/editorial page. Focus on engagement and scroll depth.",homepage:"Homepage. Focus on user routing and first-impression clarity.",auto:"Infer the page type from the DOM snapshot."};
    const userContextSection=userContext?.trim()?`\n## User-Provided Context\nThe user has supplied the following data. Extract signals about past tests (don't repeat them). Use wins/losses as behavioral signal. Focus on CRO-relevant signals.\n--- BEGIN USER DATA ---\n${userContext.slice(0,3000)}\n--- END USER DATA ---\n`:"";
    return `You are a senior CRO strategist and A/B testing expert.\n\n## Creative Mandate\n${CREATIVITY_MODES[creativityMode].persona}\n\n## Page Context\nURL: ${snapshot.url}\nTitle: ${snapshot.title}\nContext: ${contextMap[context]||contextMap.auto}\n${adobeSection}${userContextSection}\n## Key Page Elements\nHeadlines: ${JSON.stringify(snapshot.headlines.map(h=>h.text))}\nCTAs: ${JSON.stringify(snapshot.ctas.map(c=>c.text))}\nForms: ${JSON.stringify(snapshot.forms)}\nPrice/Rate elements: ${JSON.stringify(snapshot.priceElements)}\nBadges/Labels: ${JSON.stringify(snapshot.badges)}\nAEM Components: ${JSON.stringify(snapshot.aemComponents.slice(0,8))}\nImages detected: ${snapshot.images.length}\n\n## DOM Structure (abbreviated)\n\`\`\`\n${snapshot.rawStructure.slice(0,2000)}\n\`\`\`\n\n## Instructions\nGenerate 6 high-quality A/B test ideas. Return EXACTLY this JSON (no markdown, no code fences):\n{"ideas":[{"id":1,"title":"Short test name","priority":"high|mid|low","type":"copy|layout|ux|personalization|social-proof|urgency|pricing","element":"CSS selector or element description","hypothesis":"If we [change X] then [metric Y] will improve because [reason Z]","control":"Current state description","variant":"Proposed change","primary_metric":"Metric to measure","secondary_metrics":["metric2","metric3"],"implementation_effort":"low|medium|high","adobe_notes":"Notes on leveraging Adobe Analytics/Target/AEM (or null)"}],"page_summary":"2-3 sentence CRO assessment of this page"}\n\nPrioritize tests that are specific, measurable, and tied to conversion. Reference actual elements found in the DOM.`;
  }

  async function fetchIdeas(apiKey,prompt,creativityMode) {
    const res=await fetch(CFG.apiEndpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:CFG.modelId,max_tokens:CFG.maxTokens,temperature:CREATIVITY_MODES[creativityMode].temperature,messages:[{role:"system",content:"You are a senior conversion optimization strategist. Always respond with valid JSON only — no markdown, no code fences."},{role:"user",content:prompt}],response_format:{type:"json_object"}})});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.error?.message||`API error ${res.status}`);}
    const data=await res.json();const text=data.choices?.[0]?.message?.content||"";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  }

  // ══════════════════════════════════════════════════════════
  //  BUILD PANEL
  // ══════════════════════════════════════════════════════════
  const host = document.createElement("div");
  host.id = "__rl_ide_host";
  host.style.cssText = "position:fixed;top:20px;right:20px;width:440px;max-height:90vh;z-index:2147483647;pointer-events:auto;min-width:400px;min-height:220px;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode:"open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  shadow.appendChild(styleEl);

  const root = document.createElement("div");
  root.id = "__rlide_root";

  const adobe = detectAdobe();
  const ctxOptions = ["auto","rental","ecommerce","saas","content","homepage"];

  root.innerHTML = `
    <div id="__rlide_header">
      <div class="rl-header-left">
        <div class="rl-wordmark">LiftLab<span>.</span>Ideate</div>
        <div class="rl-subtitle">AI Test Ideation · Adobe + GPT-4o</div>
      </div>
      <div class="rl-header-right">
        <button class="rl-icon-btn" id="__rl_dom_btn" title="View DOM snapshot">{ }</button>
        <button class="rl-icon-btn" id="__rl_min_btn" title="Minimize">−</button>
        <button class="rl-icon-btn danger" id="__rl_close_btn" title="Close">✕</button>
      </div>
    </div>

    <div id="__rlide_body">

      <div>
        <div class="rl-section-hd">OpenAI API Key</div>
        <div class="rl-input-row">
          <input id="__rl_apikey" class="rl-input" type="password" placeholder="sk-proj-…" autocomplete="off" spellcheck="false" />
          <button class="rl-btn-sm" id="__rl_save_key">Save</button>
        </div>
      </div>

      <div>
        <div class="rl-section-hd">Page Context</div>
        <div class="rl-chip-grid">
          ${ctxOptions.map(c=>`<button class="rl-ctx-chip${c==="auto"?" active":""}" data-ctx="${c}">${c}</button>`).join("")}
        </div>
      </div>

      <div class="rl-adobe-bar">
        <div class="rl-section-hd" style="margin-bottom:8px">Adobe Stack</div>
        <div class="rl-adobe-badges">
          ${[["Analytics",adobe.analytics],["Launch",adobe.launch],["Target",adobe.target],["AEM",adobe.aem],["Data Layer",adobe.dataLayer]]
            .map(([k,v])=>`<span class="adobe-badge ${v?"detected":"missing"}">${k}</span>`).join("")}
        </div>
      </div>

      <div class="rl-creativity-box">
        <div class="rl-creativity-head">
          <div class="rl-section-hd" style="margin-bottom:0">Creativity</div>
          <span class="rl-creativity-mode-label" id="__rl_mode_label">Balanced</span>
        </div>
        <div class="rl-seg-track">
          <button class="rl-seg" data-mode="0">Conservative</button>
          <button class="rl-seg active mode-1" data-mode="1">Balanced</button>
          <button class="rl-seg" data-mode="2">Experimental</button>
        </div>
        <div class="rl-temp-bar">
          ${[0,1,2,3,4].map(i=>`<div class="rl-temp-dot" id="__rl_td${i}"></div>`).join("")}
          <span class="rl-temp-label" id="__rl_temp_label">temp 0.7</span>
        </div>
        <div class="rl-creativity-desc" id="__rl_creativity_desc">Mix of proven tactics and moderate innovation.</div>
      </div>

      <div>
        <div class="rl-drawer-toggle" id="__rl_drawer_toggle">
          <div class="rl-drawer-left">
            <span class="rl-drawer-label">Your Data</span>
            <span class="rl-ctx-badge" id="__rl_ctx_badge">0</span>
          </div>
          <span class="rl-drawer-chev">⌄</span>
        </div>
        <div class="rl-drawer-body" id="__rl_drawer_body">
          <div class="rl-inner-tabs">
            <button class="rl-inner-tab active" data-tab="paste">Paste</button>
            <button class="rl-inner-tab" data-tab="url">URL / Link</button>
          </div>
          <div class="rl-inner-panel active" id="__rl_panel_paste">
            <textarea class="rl-textarea" id="__rl_ctx_paste"
              placeholder="Paste anything — past test results, analytics notes, audience segments, experiment learnings…&#10;&#10;No clean format required."
              spellcheck="false"></textarea>
            <div class="rl-helper-row">
              <span class="rl-helper">Unstructured OK — bullet points, tables, mixed text all work.</span>
              <button class="rl-clear-sm" id="__rl_paste_clear">Clear</button>
            </div>
          </div>
          <div class="rl-inner-panel" id="__rl_panel_url">
            <div style="display:flex;gap:6px">
              <input id="__rl_ctx_url" class="rl-input" type="url" placeholder="https://— sitemap, shared doc, public page…" spellcheck="false" />
              <button class="rl-btn-sm" id="__rl_url_fetch">Fetch</button>
            </div>
            <div id="__rlide_url_status">
              <span class="url-dot"></span>
              <span id="__rl_url_status_text"></span>
            </div>
            <span class="rl-helper">Works with XML sitemaps and public pages. Content stays local.</span>
          </div>
        </div>
      </div>

      <button id="__rlide_scan_btn">⚡ Scan &amp; Generate Ideas</button>
      <div id="__rlide_error"></div>

      <div id="__rlide_results">
        <hr class="rl-divider" />
        <div id="__rlide_summary"></div>
        <div id="__rlide_ideas"></div>
        <div id="__rlide_dom_preview"></div>
      </div>

    </div>

    <div id="__rlide_footer">
      <div class="rl-footer-brand">LiftLab<span>.</span>Ideate <span style="color:var(--white-faint);font-weight:400">v2.0</span></div>
      <a href="#" id="__rl_show_dom">View DOM snapshot</a>
    </div>
  `;
  shadow.appendChild(root);

  const $  = id  => shadow.getElementById(id);
  const $$ = sel => shadow.querySelectorAll(sel);

  const savedKey = sessionStorage.getItem(CFG.sessionKey) || "";
  if (savedKey) $("__rl_apikey").value = savedKey;

  // ── STATE ──────────────────────────────────────────────
  let selectedCtx = "auto", creativityMode = 1, lastSnapshot = null, fetchedUrlContent = "";

  // ── CREATIVITY ─────────────────────────────────────────
  const dotCountMap = { 0:2, 1:3, 2:5 };
  function applyCreativityMode(mode) {
    creativityMode = mode;
    const cfg = CREATIVITY_MODES[mode];
    $$(".rl-seg").forEach(s=>s.classList.remove("active","mode-0","mode-1","mode-2"));
    shadow.querySelector(`.rl-seg[data-mode="${mode}"]`)?.classList.add("active",`mode-${mode}`);
    $("__rl_mode_label").textContent = cfg.label;
    $("__rl_creativity_desc").textContent = cfg.desc;
    $("__rl_temp_label").textContent = `temp ${cfg.temperature}`;
    const litCount = dotCountMap[mode];
    [0,1,2,3,4].forEach(i=>{
      const d=$(`__rl_td${i}`);
      d.className="rl-temp-dot";
      if(i<litCount) d.classList.add(`lit-${mode}`);
    });
    $("__rlide_scan_btn").classList.toggle("mode-warm", mode===2);
  }
  $$(".rl-seg").forEach(seg=>seg.addEventListener("click",()=>applyCreativityMode(+seg.dataset.mode)));
  applyCreativityMode(1);

  // ── DRAWER ─────────────────────────────────────────────
  $("__rl_drawer_toggle").addEventListener("click",()=>{
    const open = $("__rl_drawer_body").classList.contains("open");
    $("__rl_drawer_body").classList.toggle("open",!open);
    $("__rl_drawer_toggle").classList.toggle("open",!open);
  });
  $$(".rl-inner-tab").forEach(tab=>tab.addEventListener("click",e=>{
    e.stopPropagation();
    $$(".rl-inner-tab").forEach(t=>t.classList.remove("active"));
    $$(".rl-inner-panel").forEach(p=>p.classList.remove("active"));
    tab.classList.add("active");
    $(`__rl_panel_${tab.dataset.tab}`).classList.add("active");
  }));

  function updateCtxBadge() {
    const c=[($("__rl_ctx_paste").value.trim().length>0),(fetchedUrlContent.length>0)].filter(Boolean).length;
    const b=$("__rl_ctx_badge"); b.textContent=c; b.classList.toggle("visible",c>0);
  }
  $("__rl_ctx_paste").addEventListener("input",updateCtxBadge);
  $("__rl_paste_clear").addEventListener("click",e=>{e.stopPropagation();$("__rl_ctx_paste").value="";updateCtxBadge();});

  function setUrlStatus(state,text) {
    const el=$("__rlide_url_status"); el.className=state; el.style.display=state?"flex":"none";
    $("__rl_url_status_text").textContent=text;
  }
  $("__rl_url_fetch").addEventListener("click",async e=>{
    e.stopPropagation();
    const url=$("__rl_ctx_url").value.trim(); if(!url) return;
    try{new URL(url);}catch{setUrlStatus("error","Invalid URL — include https://");return;}
    const btn=$("__rl_url_fetch"); btn.disabled=true; btn.textContent="…";
    setUrlStatus("loading","Fetching…"); fetchedUrlContent="";
    try {
      let text="";
      try{const res=await fetch(url,{mode:"cors"});if(!res.ok)throw new Error(`HTTP ${res.status}`);const raw=await res.text();text=raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<[^>]+>/g," ").replace(/\s{2,}/g," ").trim().slice(0,4000);}
      catch{text=`[URL provided — CORS restricted. Reference URL for site structure context: ${url}]`;}
      fetchedUrlContent=`Source URL: ${url}\n\n${text}`;
      setUrlStatus("success",`Fetched — ${(fetchedUrlContent.length/1000).toFixed(1)}k chars`);
      updateCtxBadge();
    } catch(err){setUrlStatus("error",err.message||"Fetch failed");fetchedUrlContent="";updateCtxBadge();}
    btn.disabled=false; btn.textContent="Fetch";
  });

  function getUserContext() {
    const parts=[];
    const p=$("__rl_ctx_paste")?.value?.trim(); if(p) parts.push(`=== PASTED DATA ===\n${p}`);
    if(fetchedUrlContent) parts.push(`=== FETCHED URL CONTENT ===\n${fetchedUrlContent}`);
    return parts.join("\n\n");
  }

  // ── CONTEXT CHIPS ──────────────────────────────────────
  $$(".rl-ctx-chip").forEach(chip=>chip.addEventListener("click",()=>{
    $$(".rl-ctx-chip").forEach(c=>c.classList.remove("active"));
    chip.classList.add("active"); selectedCtx=chip.dataset.ctx;
  }));

  // ── HEADER CONTROLS ────────────────────────────────────
  $("__rl_close_btn").addEventListener("click",()=>host.style.display="none");
  $("__rl_min_btn").addEventListener("click",()=>{
    const body=$("__rlide_body"),footer=$("__rlide_footer");
    const c=body.style.display==="none";
    body.style.display=footer.style.display=c?"":"none";
  });
  $("__rl_dom_btn").addEventListener("click",()=>{
    const p=$("__rlide_dom_preview");
    if(lastSnapshot){p.textContent=lastSnapshot.rawStructure;p.style.display=p.style.display==="none"?"block":"none";$("__rlide_results").classList.add("visible");}
  });
  $("__rl_show_dom").addEventListener("click",e=>{e.preventDefault();$("__rl_dom_btn").click();});
  $("__rl_save_key").addEventListener("click",()=>{
    const key=$("__rl_apikey").value.trim(); if(!key) return;
    sessionStorage.setItem(CFG.sessionKey,key);
    const btn=$("__rl_save_key"); btn.textContent="✓ Saved";
    setTimeout(()=>btn.textContent="Save",1600);
  });

  // ── DRAG ───────────────────────────────────────────────
  let dragging=false,dragX=0,dragY=0;
  $("__rlide_header").addEventListener("mousedown",e=>{
    if(e.target.closest(".rl-icon-btn")) return;
    const r=host.getBoundingClientRect(); dragging=true; dragX=e.clientX-r.left; dragY=e.clientY-r.top; e.preventDefault();
  });
  document.addEventListener("mousemove",e=>{if(!dragging) return;host.style.right="auto";host.style.left=(e.clientX-dragX)+"px";host.style.top=(e.clientY-dragY)+"px";});
  document.addEventListener("mouseup",()=>dragging=false);

  // ── MAIN: SCAN + GENERATE ──────────────────────────────
  $("__rlide_scan_btn").addEventListener("click",async()=>{
    const apiKey=$("__rl_apikey").value.trim();
    const errDiv=$("__rlide_error"), results=$("__rlide_results"), scanBtn=$("__rlide_scan_btn");
    errDiv.style.display="none"; results.classList.remove("visible");

    if(!apiKey){errDiv.innerHTML="⚠ Please enter your OpenAI API key above.";errDiv.style.display="block";return;}
    scanBtn.disabled=true; scanBtn.innerHTML=`<span class="rl-spinner"></span> Scanning DOM…`;

    try {
      const snapshot=scanDOM(); lastSnapshot=snapshot;
      scanBtn.innerHTML=`<span class="rl-spinner"></span> Generating ideas…`;
      const parsed=await fetchIdeas(apiKey,buildPrompt(snapshot,selectedCtx,adobe,creativityMode,getUserContext()),creativityMode);

      $("__rlide_summary").innerHTML=`<div class="sum-eyebrow">Page Assessment</div><div class="sum-text">${parsed.page_summary||""}</div>`;

      const container=$("__rlide_ideas"); container.innerHTML="";
      container.style.cssText="display:flex;flex-direction:column;gap:8px;";

      (parsed.ideas||[]).forEach((idea,i)=>{
        const prioClass=idea.priority==="high"?"high":idea.priority==="mid"?"mid":"low";
        const card=document.createElement("div");
        card.className=`rl-idea-card prio-${prioClass}`;
        card.style.animationDelay=`${i*60}ms`;
        card.innerHTML=`
          <div class="rl-card-top">
            <span class="rl-idea-num">${String(idea.id||i+1).padStart(2,"0")}</span>
            <span class="rl-idea-title">${idea.title}</span>
            <span class="rl-prio ${prioClass}">${idea.priority}</span>
          </div>
          <div class="rl-idea-hyp">${idea.hypothesis}</div>
          <details class="rl-details">
            <summary>
              <span class="sum-left">
                <span class="sum-pill">details</span>
                <span>Control, Variant${idea.adobe_notes?", Adobe":""}</span>
              </span>
              <span class="chev">⌄</span>
            </summary>
            <div class="rl-details-body">
              <div>
                <div class="rl-cv-row"><span class="cv-pill ctrl">Ctrl</span><span class="cv-text-ctrl">${idea.control}</span></div>
                <div class="rl-cv-row"><span class="cv-pill var">Var</span><span class="cv-text-var">${idea.variant}</span></div>
              </div>
              ${idea.adobe_notes?`<div class="rl-adobe-note"><span class="note-icon">⬡</span><span>${idea.adobe_notes}</span></div>`:""}
            </div>
          </details>
          <div class="rl-card-footer">
            <div class="rl-tags">
              <span class="rl-tag type">${idea.type}</span>
              <span class="rl-tag element" title="${idea.element}">${idea.element}</span>
              <span class="rl-tag metric" title="${idea.primary_metric}">↗ ${idea.primary_metric}</span>
              <span class="rl-tag effort">effort: ${idea.implementation_effort}</span>
            </div>
            <button class="rl-copy-btn" data-idx="${i}">Copy</button>
          </div>`;
        container.appendChild(card);
      });

      container.querySelectorAll(".rl-copy-btn").forEach(btn=>btn.addEventListener("click",()=>{
        const idea=parsed.ideas[+btn.dataset.idx];
        const text=[`A/B TEST IDEA #${String(idea.id).padStart(2,"0")} — ${idea.title}`,`Priority: ${idea.priority.toUpperCase()}  |  Type: ${idea.type}  |  Effort: ${idea.implementation_effort}`,``,`HYPOTHESIS`,idea.hypothesis,``,`CONTROL`,idea.control,``,`VARIANT`,idea.variant,``,`PRIMARY METRIC`,idea.primary_metric,...(idea.secondary_metrics?.length?[``,`SECONDARY METRICS`,idea.secondary_metrics.join(", ")]:[]),``,`ELEMENT`,idea.element,...(idea.adobe_notes?[``,`ADOBE NOTES`,idea.adobe_notes]:[]),``,`─────────────────────────────`,`Generated by LiftLab.Ideate · ramseyjlewis.com`].join("\n");
        navigator.clipboard.writeText(text);
        btn.textContent="✓ Copied"; setTimeout(()=>btn.textContent="Copy",1600);
      }));

      results.classList.add("visible");
      scanBtn.innerHTML="↺ Re-scan Page";
    } catch(err){
      errDiv.textContent=`❌  ${err.message}`; errDiv.style.display="block";
      scanBtn.innerHTML="⚡ Scan &amp; Generate Ideas";
    }
    scanBtn.disabled=false;
  });

  console.log("%c✓ LiftLab.Ideate v2.0 · ramseyjlewis.com","color:#00d4c8;font-weight:700;font-size:13px");

  /*
   * ── BOOKMARKLET ────────────────────────────────────────────
   * javascript:(function(){const s=document.createElement('script');
   * s.src='https://YOUR_CDN/liftlab-ideate.js';
   * document.head.appendChild(s);})();
   */
})();
