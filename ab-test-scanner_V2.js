/**
 * ============================================================
 *  AI A/B TEST IDEA GENERATOR — DOM Scanner + Adobe Hooks
 *  by Ramsey Lewis  ·  v4.0
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
  };

  // ══════════════════════════════════════════════════════════
  //  DESIGN SYSTEM
  //  Spacing scale: 4, 8, 12, 16, 20, 24, 32
  //  Type scale: 10, 11, 12, 13, 15
  //  Radii: 8 (chips/tags), 10 (inputs), 12 (cards/sections), 14 (panel)
  //  Colors: Apple system palette — dark mode
  // ══════════════════════════════════════════════════════════
  const css = `
    /* ── Reset scoped to panel ── */
    #__abt_scanner_root *,
    #__abt_scanner_root *::before,
    #__abt_scanner_root *::after {
      box-sizing: border-box;
      margin: 0; padding: 0;
      font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── CSS custom properties ── */
    #__abt_scanner_root {
      --bg-panel:      rgba(30, 30, 32, 0.97);
      --bg-elevated:   rgba(44, 44, 46, 0.8);
      --bg-input:      rgba(255, 255, 255, 0.055);
      --bg-inset:      rgba(0, 0, 0, 0.25);

      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-mid:    rgba(255, 255, 255, 0.12);

      --text-primary:  rgba(255, 255, 255, 0.92);
      --text-secondary:rgba(255, 255, 255, 0.52);
      --text-tertiary: rgba(255, 255, 255, 0.28);
      --text-caption:  rgba(255, 255, 255, 0.20);

      --blue:   #0A84FF;
      --green:  #30D158;
      --orange: #FF9F0A;
      --red:    #FF453A;
      --indigo: #5E5CE6;

      --blue-bg:   rgba(10, 132, 255, 0.10);
      --blue-border: rgba(10, 132, 255, 0.20);
      --green-bg:  rgba(48, 209, 88, 0.08);
      --orange-bg: rgba(255, 159, 10, 0.10);
      --red-bg:    rgba(255, 69, 58, 0.10);
      --indigo-bg: rgba(94, 92, 230, 0.10);

      --radius-sm:  8px;
      --radius-md:  10px;
      --radius-lg:  12px;
      --radius-xl:  14px;
      --radius-2xl: 18px;

      --transition: 0.16s cubic-bezier(0.25, 0.46, 0.45, 0.94);

      /* Panel */
      position: fixed;
      top: 16px; right: 16px;
      width: 420px;
      max-height: 90vh;
      background: var(--bg-panel);
      -webkit-backdrop-filter: blur(60px) saturate(200%);
      backdrop-filter: blur(60px) saturate(200%);
      border: 0.5px solid rgba(255,255,255,0.14);
      border-radius: var(--radius-2xl);
      display: flex;
      flex-direction: column;
      z-index: 2147483647;
      box-shadow:
        0 0 0 0.5px rgba(255,255,255,0.05) inset,
        0 1px 0 rgba(255,255,255,0.08) inset,
        0 40px 80px rgba(0,0,0,0.7),
        0 12px 24px rgba(0,0,0,0.4);
      overflow: hidden;
      resize: both;
      min-width: 360px;
      min-height: 220px;
      font-size: 13px;
      color: var(--text-primary);
    }

    /* ════════════════════════════════════════
       TITLEBAR
    ════════════════════════════════════════ */
    #__abt_header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 16px 12px;
      border-bottom: 0.5px solid var(--border-subtle);
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
      /* Subtle top glass sheen */
      background: linear-gradient(180deg,
        rgba(255,255,255,0.04) 0%,
        rgba(255,255,255,0.00) 100%);
    }
    #__abt_header:active { cursor: grabbing; }

    /* Traffic lights */
    #__abt_traffic_lights { display: flex; gap: 7px; flex-shrink: 0; }
    .abt-tl {
      width: 12px; height: 12px; border-radius: 50%;
      cursor: pointer; position: relative;
      transition: filter var(--transition);
      display: flex; align-items: center; justify-content: center;
    }
    .abt-tl:hover { filter: brightness(1.15); }
    .abt-tl-close { background: #FF5F57; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.25); }
    .abt-tl-min   { background: #FEBC2E; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.25); }
    .abt-tl-max   { background: #28C840; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.25); }

    /* Traffic light icons on group hover */
    .abt-tl .tl-icon {
      font-size: 7px; font-weight: 900; color: rgba(0,0,0,0.55);
      opacity: 0; transition: opacity var(--transition);
      line-height: 1; pointer-events: none;
    }
    #__abt_traffic_lights:hover .tl-icon { opacity: 1; }

    #__abt_title {
      font-size: 13px;
      font-weight: 590;
      letter-spacing: -0.015em;
      color: var(--text-primary);
      flex: 1;
      line-height: 1;
    }
    #__abt_title .byline {
      display: block;
      font-size: 10px;
      font-weight: 400;
      color: var(--text-tertiary);
      letter-spacing: 0;
      margin-top: 2px;
    }

    /* ════════════════════════════════════════
       SCROLLABLE BODY
    ════════════════════════════════════════ */
    #__abt_body {
      flex: 1;
      overflow-y: auto;
      /* 20px horizontal gutter, 16px top, 20px bottom breathing room */
      padding: 16px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    #__abt_body::-webkit-scrollbar { width: 3px; }
    #__abt_body::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
    }

    /* ── Section label — SF Pro caption style ── */
    .abt-section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.055em;
      text-transform: uppercase;
      color: var(--text-tertiary);
      margin-bottom: 7px;
    }

    /* ════════════════════════════════════════
       API KEY ROW
    ════════════════════════════════════════ */
    #__abt_apirow { display: flex; gap: 8px; align-items: center; }

    #__abt_apirow input {
      flex: 1;
      height: 36px;
      background: var(--bg-input);
      border: 0.5px solid var(--border-mid);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      padding: 0 12px;
      font-size: 12px;
      font-weight: 400;
      outline: none;
      transition: border-color var(--transition), background var(--transition),
                  box-shadow var(--transition);
    }
    #__abt_apirow input:focus {
      border-color: var(--blue);
      background: var(--blue-bg);
      box-shadow: 0 0 0 3px rgba(10,132,255,0.18);
    }
    #__abt_apirow input::placeholder { color: var(--text-caption); }

    .abt-inline-btn {
      height: 36px;
      padding: 0 14px;
      background: var(--bg-elevated);
      border: 0.5px solid var(--border-mid);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition);
      display: flex; align-items: center; gap: 5px;
    }
    .abt-inline-btn:hover {
      background: rgba(255,255,255,0.10);
      color: var(--text-primary);
      border-color: rgba(255,255,255,0.18);
    }
    .abt-inline-btn:active { opacity: 0.75; }

    /* ════════════════════════════════════════
       CONTEXT CHIPS — 3-up grid
    ════════════════════════════════════════ */
    #__abt_context_grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .ctx-chip {
      height: 30px;
      display: flex; align-items: center; justify-content: center;
      border: 0.5px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-tertiary);
      background: rgba(255,255,255,0.03);
      letter-spacing: -0.01em;
      transition: all var(--transition);
    }
    .ctx-chip:hover {
      border-color: var(--border-mid);
      color: var(--text-secondary);
      background: rgba(255,255,255,0.06);
    }
    .ctx-chip.active {
      border-color: var(--blue);
      color: var(--blue);
      background: var(--blue-bg);
    }

    /* ════════════════════════════════════════
       ADOBE STATUS — grouped inset card
    ════════════════════════════════════════ */
    #__abt_adobe_bar {
      background: var(--bg-inset);
      border: 0.5px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
    }
    #__abt_adobe_badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .adobe-badge {
      height: 22px;
      padding: 0 9px;
      display: inline-flex; align-items: center;
      font-size: 11px;
      font-weight: 500;
      border-radius: 6px;
      border: 0.5px solid;
      letter-spacing: -0.01em;
    }
    .adobe-badge.detected {
      border-color: rgba(48, 209, 88, 0.35);
      color: var(--green);
      background: var(--green-bg);
    }
    .adobe-badge.missing {
      border-color: var(--border-subtle);
      color: var(--text-caption);
      background: transparent;
    }

    /* ════════════════════════════════════════
       CREATIVITY TUNER
    ════════════════════════════════════════ */
    #__abt_creativity_section {
      background: var(--bg-inset);
      border: 0.5px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    #__abt_creativity_header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #__abt_creativity_header .abt-section-label { margin-bottom: 0; }

    #__abt_creativity_mode_label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      transition: color var(--transition);
    }

    /* Apple segmented control */
    #__abt_creativity_track {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
      background: rgba(255,255,255,0.05);
      border: 0.5px solid var(--border-subtle);
      border-radius: 9px;
      padding: 2px;
    }
    .creativity-seg {
      height: 28px;
      border: none;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      color: var(--text-tertiary);
      background: transparent;
      transition: all var(--transition);
      letter-spacing: -0.01em;
    }
    .creativity-seg:hover:not(.active) { color: var(--text-secondary); }
    .creativity-seg.active {
      box-shadow: 0 1px 3px rgba(0,0,0,0.35), 0 0.5px 0 rgba(255,255,255,0.05) inset;
    }
    .creativity-seg.active.mode-0 {
      background: rgba(10,132,255,0.22);
      color: var(--blue);
    }
    .creativity-seg.active.mode-1 {
      background: rgba(255,255,255,0.11);
      color: var(--text-primary);
    }
    .creativity-seg.active.mode-2 {
      background: rgba(255,159,10,0.22);
      color: var(--orange);
    }

    /* Temperature indicator row */
    #__abt_temp_bar {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .temp-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(255,255,255,0.10);
      transition: background var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .temp-dot.lit-0 {
      background: var(--blue);
      box-shadow: 0 0 6px rgba(10,132,255,0.7);
      transform: scale(1.1);
    }
    .temp-dot.lit-1 {
      background: rgba(255,255,255,0.65);
      box-shadow: 0 0 4px rgba(255,255,255,0.3);
      transform: scale(1.05);
    }
    .temp-dot.lit-2 {
      background: var(--orange);
      box-shadow: 0 0 6px rgba(255,159,10,0.7);
      transform: scale(1.1);
    }
    #__abt_temp_label {
      font-size: 10px;
      font-weight: 400;
      color: var(--text-caption);
      margin-left: 5px;
      font-variant-numeric: tabular-nums;
    }

    #__abt_creativity_desc {
      font-size: 11px;
      font-weight: 400;
      color: var(--text-tertiary);
      line-height: 1.5;
      min-height: 16px;
    }

    /* ════════════════════════════════════════
       SCAN BUTTON — full bleed, bold
    ════════════════════════════════════════ */
    #__abt_scan_btn {
      width: 100%;
      height: 40px;
      background: var(--blue);
      border: none;
      border-radius: var(--radius-lg);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.015em;
      cursor: pointer;
      transition: all var(--transition);
      display: flex; align-items: center; justify-content: center; gap: 7px;
      /* Subtle top gloss */
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset;
    }
    #__abt_scan_btn:hover {
      background: #0077ED;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset,
                  0 6px 20px rgba(10,132,255,0.38);
      transform: translateY(-0.5px);
    }
    #__abt_scan_btn:active {
      background: #006ACC;
      transform: translateY(0.5px);
      box-shadow: none;
    }
    #__abt_scan_btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    #__abt_scan_btn.mode-warm   { background: var(--orange); }
    #__abt_scan_btn.mode-warm:hover {
      background: #E8900A;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset,
                  0 6px 20px rgba(255,159,10,0.38);
    }

    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: abt_spin 0.65s linear infinite;
      flex-shrink: 0;
    }
    @keyframes abt_spin { to { transform: rotate(360deg); } }

    /* ════════════════════════════════════════
       ERROR STATE
    ════════════════════════════════════════ */
    #__abt_error {
      background: var(--red-bg);
      border: 0.5px solid rgba(255,69,58,0.25);
      border-radius: var(--radius-lg);
      padding: 11px 14px;
      color: var(--red);
      font-size: 12px;
      line-height: 1.55;
      display: none;
    }

    /* ════════════════════════════════════════
       RESULTS SECTION
    ════════════════════════════════════════ */
    #__abt_results_section { display: none; flex-direction: column; gap: 12px; }
    #__abt_results_section.visible { display: flex; }

    /* Hairline divider */
    .abt-divider { border: none; border-top: 0.5px solid var(--border-subtle); }

    /* Page summary */
    #__abt_page_summary {
      background: var(--blue-bg);
      border: 0.5px solid var(--blue-border);
      border-radius: var(--radius-lg);
      padding: 15px 16px;
    }
    .sum-eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--blue);
      margin-bottom: 7px;
    }
    .sum-text {
      font-size: 13px;
      font-weight: 400;
      color: var(--text-secondary);
      line-height: 1.65;
    }

    /* ════════════════════════════════════════
       IDEA CARDS — the heart of the UI
    ════════════════════════════════════════ */
    .abt-idea-card {
      background: var(--bg-elevated);
      border: 0.5px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      /* Generous outer padding — 18px sides, 16px top, 14px bottom */
      padding: 16px 18px 14px;
      display: flex;
      flex-direction: column;
      gap: 0;
      transition: border-color var(--transition), background var(--transition);
      animation: abt_fadein 0.32s ease both;
      cursor: default;
    }
    .abt-idea-card:hover {
      border-color: var(--border-mid);
      background: rgba(58, 58, 62, 0.85);
    }
    @keyframes abt_fadein {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0);   }
    }

    /* Card row 1: number + title + priority badge */
    .abt-card-top {
      display: flex;
      align-items: flex-start;
      gap: 9px;
    }
    .abt-idea-num {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--text-caption);
      flex-shrink: 0;
      margin-top: 3px;
    }
    .abt-idea-title {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.3;
      flex: 1;
    }
    .abt-priority {
      flex-shrink: 0;
      height: 20px;
      padding: 0 8px;
      border-radius: 20px;
      border: 0.5px solid;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
      display: flex; align-items: center;
      margin-top: 2px;
    }
    .abt-priority.high  { color: var(--red);    border-color: rgba(255,69,58,0.35);  background: var(--red-bg);    }
    .abt-priority.mid   { color: var(--orange);  border-color: rgba(255,159,10,0.35); background: var(--orange-bg); }
    .abt-priority.low   { color: var(--blue);    border-color: var(--blue-border);    background: var(--blue-bg);   }

    /* Card row 2: hypothesis — more line-height, more top gap */
    .abt-idea-hyp {
      margin-top: 13px;
      font-size: 13px;
      font-weight: 400;
      color: var(--text-secondary);
      line-height: 1.65;
    }

    /* Card row 3: control / variant — two-row inset block */
    .abt-cv-block {
      margin-top: 13px;
      background: var(--bg-inset);
      border-radius: var(--radius-sm);
      border: 0.5px solid var(--border-subtle);
      overflow: hidden;
    }
    .abt-cv-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      /* More vertical padding so text has room to breathe */
      padding: 11px 13px;
      font-size: 12px;
      line-height: 1.55;
    }
    .abt-cv-row + .abt-cv-row {
      border-top: 0.5px solid var(--border-subtle);
    }
    .cv-pill {
      flex-shrink: 0;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      border-radius: 4px;
      padding: 2px 6px;
      margin-top: 2px;
      /* Fixed width so ctrl and var text always left-align */
      min-width: 32px;
      text-align: center;
    }
    .cv-pill.ctrl {
      color: var(--text-tertiary);
      background: rgba(255,255,255,0.06);
      border: 0.5px solid var(--border-subtle);
    }
    .cv-pill.var {
      color: var(--blue);
      background: var(--blue-bg);
      border: 0.5px solid var(--blue-border);
    }
    .cv-text-ctrl { color: var(--text-tertiary); font-weight: 400; }
    .cv-text-var  { color: var(--text-primary);  font-weight: 400; }

    /* Card row 4: Adobe notes */
    .abt-adobe-note {
      margin-top: 10px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--blue-bg);
      border: 0.5px solid var(--blue-border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 400;
      color: rgba(10,132,255,0.85);
      line-height: 1.6;
    }
    .abt-adobe-note .note-icon {
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 2px;
      opacity: 0.7;
    }

    /* Card row 5: tags + copy btn */
    .abt-card-footer {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .abt-tags { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; }
    .abt-tag {
      height: 20px;
      padding: 0 8px;
      display: inline-flex; align-items: center;
      font-size: 10px;
      font-weight: 500;
      border-radius: 5px;
      border: 0.5px solid;
      letter-spacing: -0.01em;
    }
    .abt-tag.type {
      color: var(--indigo);
      border-color: rgba(94,92,230,0.25);
      background: var(--indigo-bg);
    }
    .abt-tag.element {
      color: var(--green);
      border-color: rgba(48,209,88,0.2);
      background: var(--green-bg);
    }
    .abt-tag.metric {
      color: var(--orange);
      border-color: rgba(255,159,10,0.22);
      background: var(--orange-bg);
    }
    .abt-tag.effort {
      color: var(--text-tertiary);
      border-color: var(--border-subtle);
      background: transparent;
    }

    /* Copy button — ghost, right-aligned */
    .abt-copy-btn {
      flex-shrink: 0;
      height: 24px;
      padding: 0 10px;
      background: transparent;
      border: 0.5px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--text-caption);
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex; align-items: center; gap: 4px;
    }
    .abt-copy-btn:hover {
      border-color: var(--blue);
      color: var(--blue);
      background: var(--blue-bg);
    }
    .abt-copy-btn:active { opacity: 0.6; }

    /* ════════════════════════════════════════
       DOM PREVIEW
    ════════════════════════════════════════ */
    #__abt_dom_preview {
      background: rgba(0,0,0,0.35);
      border: 0.5px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      font-size: 10px;
      font-family: 'SF Mono', 'Menlo', 'Cascadia Code', monospace;
      color: var(--text-tertiary);
      max-height: 100px;
      overflow: hidden;
      white-space: pre;
      display: none;
    }

    /* ════════════════════════════════════════
       FOOTER
    ════════════════════════════════════════ */
    #__abt_footer {
      padding: 9px 20px;
      border-top: 0.5px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-caption);
      flex-shrink: 0;
    }
    #__abt_footer a {
      color: var(--text-caption);
      text-decoration: none;
      transition: color var(--transition);
    }
    #__abt_footer a:hover { color: var(--blue); }
  `;

  // ══════════════════════════════════════════════════════════
  //  CREATIVITY CONFIG
  // ══════════════════════════════════════════════════════════
  const CREATIVITY_MODES = [
    {
      label: "Conservative",
      temperature: 0.3,
      desc: "Proven, low-risk patterns with documented lift.",
      persona: "Focus only on well-established, low-risk CRO patterns with strong documented conversion lift. No experimental ideas. Prioritize quick wins and high-confidence tests.",
    },
    {
      label: "Balanced",
      temperature: 0.7,
      desc: "Mix of proven tactics and moderate innovation.",
      persona: "Balance proven CRO tactics with moderate innovation. Reference industry benchmarks where possible. Include both safe wins and a few more creative hypotheses.",
    },
    {
      label: "Experimental",
      temperature: 1.1,
      desc: "Counter-intuitive ideas driven by behavioral psychology.",
      persona: "Push boundaries. Include at least 2 unconventional or counter-intuitive test ideas that challenge assumptions about user behavior. Think behavioral psychology, cognitive biases, and interaction patterns — not just UI tweaks. Be bold.",
    },
  ];

  // ══════════════════════════════════════════════════════════
  //  DOM SCANNER
  // ══════════════════════════════════════════════════════════
  function scanDOM() {
    const snapshot = {
      url: location.href, title: document.title,
      meta: {}, aemComponents: [], forms: [], ctas: [],
      headlines: [], images: [], priceElements: [], badges: [],
      adobeLayer: null, adobeAnalyticsVars: null, adobeTargetMboxes: [],
      rawStructure: "",
    };

    document.querySelectorAll("meta[name], meta[property]").forEach((m) => {
      snapshot.meta[m.getAttribute("name") || m.getAttribute("property")] = m.content;
    });

    document.querySelectorAll("[data-cq-component],[data-component],[data-sly-use],[class*='cmp-']").forEach((el) => {
      const type = el.getAttribute("data-cq-component") || el.getAttribute("data-component") ||
                   [...el.classList].find((c) => c.startsWith("cmp-")) || "unknown";
      snapshot.aemComponents.push({ type, text: el.innerText?.trim().slice(0, 80) });
    });

    if (window.adobeDataLayer) {
      try {
        snapshot.adobeLayer = JSON.stringify(
          window.adobeDataLayer.getState ? window.adobeDataLayer.getState() : window.adobeDataLayer.slice(-3),
          null, 2).slice(0, 1200);
      } catch (e) { snapshot.adobeLayer = "present but unreadable"; }
    }

    const s = window.s || window.s_gi;
    if (s || window.digitalData) {
      const src = s || window.digitalData;
      const keys = ["pageName","prop1","prop2","eVar1","eVar2","eVar3","eVar10","eVar20","eVar30","channel","server","events"];
      const found = {};
      keys.forEach((k) => { if (src[k]) found[k] = src[k]; });
      if (Object.keys(found).length) snapshot.adobeAnalyticsVars = found;
    }

    if (window.adobe?.target) {
      try {
        document.querySelectorAll("[class*='mbox'],[id*='mbox']").forEach((el) => {
          snapshot.adobeTargetMboxes.push(el.id || el.className);
        });
      } catch (e) {}
    }

    document.querySelectorAll("a[href], button").forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length < 60) snapshot.ctas.push({ tag: el.tagName, text, href: el.href || null });
    });
    snapshot.ctas = snapshot.ctas.slice(0, 25);

    document.querySelectorAll("form").forEach((form) => {
      const fields = [...form.querySelectorAll("input,select,textarea")].map((f) => ({
        type: f.type || f.tagName, name: f.name, placeholder: f.placeholder,
      }));
      snapshot.forms.push({ action: form.action, fields });
    });

    document.querySelectorAll("h1,h2,h3,[class*='hero'],[class*='headline'],[class*='title']").forEach((el) => {
      const text = el.innerText?.trim();
      if (text) snapshot.headlines.push({ tag: el.tagName, text: text.slice(0, 100) });
    });
    snapshot.headlines = snapshot.headlines.slice(0, 12);

    document.querySelectorAll("img").forEach((img) => {
      snapshot.images.push({ src: img.src?.split("?")[0].slice(-60), alt: img.alt, w: img.naturalWidth });
    });
    snapshot.images = snapshot.images.filter((i) => i.w > 80).slice(0, 15);

    document.querySelectorAll("[class*='price'],[class*='rate'],[class*='offer'],[class*='deal'],[class*='discount']").forEach((el) => {
      const text = el.innerText?.trim();
      if (text) snapshot.priceElements.push(text.slice(0, 60));
    });
    snapshot.priceElements = [...new Set(snapshot.priceElements)].slice(0, 10);

    document.querySelectorAll("[class*='badge'],[class*='label'],[class*='tag'],[class*='chip'],[class*='flag']").forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length < 30) snapshot.badges.push(text);
    });
    snapshot.badges = [...new Set(snapshot.badges)].slice(0, 10);

    function nodeToString(el, depth = 0) {
      if (depth > CFG.domDepthLimit) return "";
      const tag = el.tagName?.toLowerCase();
      if (!tag || ["script","style","svg","path","noscript"].includes(tag)) return "";
      const id  = el.id ? `#${el.id}` : "";
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
  //  ADOBE DETECTION
  // ══════════════════════════════════════════════════════════
  function detectAdobe() {
    return {
      analytics: !!(window.s || window.s_gi || window.digitalData),
      launch:    !!(window._satellite),
      target:    !!(window.adobe?.target || window.mboxDefine),
      aem:       !!(document.querySelector("[data-cq-component],[class*='cmp-']") || window.adobeDataLayer),
      dataLayer: !!(window.adobeDataLayer),
    };
  }

  // ══════════════════════════════════════════════════════════
  //  PROMPT BUILDER
  // ══════════════════════════════════════════════════════════
  function buildPrompt(snapshot, context, adobe, creativityMode) {
    const adobeSection = adobe.analytics || adobe.aem || adobe.target
      ? `\n## Adobe Stack Detected\n` +
        (snapshot.adobeAnalyticsVars ? `Analytics vars: ${JSON.stringify(snapshot.adobeAnalyticsVars)}\n` : "") +
        (snapshot.adobeLayer ? `AEM Data Layer: ${snapshot.adobeLayer.slice(0, 400)}\n` : "") +
        (snapshot.adobeTargetMboxes.length ? `Target mboxes: ${snapshot.adobeTargetMboxes.join(", ")}\n` : "")
      : "";

    const contextMap = {
      rental: "Vehicle rental/fleet listing page. Focus on booking conversion.",
      ecommerce: "E-commerce product/listing page. Focus on purchase conversion.",
      saas: "SaaS or B2B landing page. Focus on lead gen / sign-up.",
      content: "Content/editorial page. Focus on engagement and scroll depth.",
      homepage: "Homepage. Focus on user routing and first-impression clarity.",
      auto: "Infer the page type from the DOM snapshot.",
    };

    return `You are a senior CRO strategist and A/B testing expert.

## Creative Mandate
${CREATIVITY_MODES[creativityMode].persona}

## Page Context
URL: ${snapshot.url}
Title: ${snapshot.title}
Context: ${contextMap[context] || contextMap.auto}
${adobeSection}

## Key Page Elements
Headlines: ${JSON.stringify(snapshot.headlines.map((h) => h.text))}
CTAs: ${JSON.stringify(snapshot.ctas.map((c) => c.text))}
Forms: ${JSON.stringify(snapshot.forms)}
Price/Rate elements: ${JSON.stringify(snapshot.priceElements)}
Badges/Labels: ${JSON.stringify(snapshot.badges)}
AEM Components: ${JSON.stringify(snapshot.aemComponents.slice(0, 8))}
Images detected: ${snapshot.images.length}

## DOM Structure (abbreviated)
\`\`\`
${snapshot.rawStructure.slice(0, 2000)}
\`\`\`

## Instructions
Generate 6 high-quality A/B test ideas. Return EXACTLY this JSON (no markdown, no code fences):
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
      "adobe_notes": "Notes on leveraging Adobe Analytics/Target/AEM (or null)"
    }
  ],
  "page_summary": "2-3 sentence CRO assessment of this page"
}

Prioritize tests that are specific, measurable, and tied to conversion. Reference actual elements found in the DOM.`;
  }

  // ══════════════════════════════════════════════════════════
  //  API CALL
  // ══════════════════════════════════════════════════════════
  async function fetchIdeas(apiKey, prompt, creativityMode) {
    const res = await fetch(CFG.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CFG.modelId,
        max_tokens: CFG.maxTokens,
        temperature: CREATIVITY_MODES[creativityMode].temperature,
        messages: [
          {
            role: "system",
            content: "You are a senior CRO strategist. Always respond with valid JSON only — no markdown, no code fences.",
          },
          { role: "user", content: prompt },
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
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }

  // ══════════════════════════════════════════════════════════
  //  INJECT STYLES + ROOT
  // ══════════════════════════════════════════════════════════
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement("div");
  root.id = "__abt_scanner_root";

  const adobe = detectAdobe();
  const ctxOptions = ["auto", "rental", "ecommerce", "saas", "content", "homepage"];

  root.innerHTML = `
    <!-- ── Titlebar ── -->
    <div id="__abt_header">
      <div id="__abt_traffic_lights">
        <div class="abt-tl abt-tl-close" title="Close">
          <span class="tl-icon">✕</span>
        </div>
        <div class="abt-tl abt-tl-min" title="Minimize">
          <span class="tl-icon">–</span>
        </div>
        <div class="abt-tl abt-tl-max" title="DOM Snapshot">
          <span class="tl-icon">+</span>
        </div>
      </div>
      <div id="__abt_title">
        A/B Test Scanner
        <span class="byline">by Ramsey Lewis</span>
      </div>
    </div>

    <!-- ── Body ── -->
    <div id="__abt_body">

      <!-- API Key -->
      <div>
        <div class="abt-section-label">OpenAI API Key</div>
        <div id="__abt_apirow">
          <input id="__abt_apikey" type="password" placeholder="sk-proj-…" autocomplete="off" spellcheck="false" />
          <button class="abt-inline-btn" id="__abt_save_key">Save</button>
        </div>
      </div>

      <!-- Context -->
      <div>
        <div class="abt-section-label">Page Context</div>
        <div id="__abt_context_grid">
          ${ctxOptions.map((c) =>
            `<div class="ctx-chip${c === "auto" ? " active" : ""}" data-ctx="${c}">${c}</div>`
          ).join("")}
        </div>
      </div>

      <!-- Adobe Stack -->
      <div id="__abt_adobe_bar">
        <div class="abt-section-label">Adobe Stack</div>
        <div id="__abt_adobe_badges">
          ${[
            ["Analytics", adobe.analytics],
            ["Launch",    adobe.launch],
            ["Target",    adobe.target],
            ["AEM",       adobe.aem],
            ["Data Layer",adobe.dataLayer],
          ].map(([k, v]) =>
            `<span class="adobe-badge ${v ? "detected" : "missing"}">${k}</span>`
          ).join("")}
        </div>
      </div>

      <!-- Creativity Tuner -->
      <div id="__abt_creativity_section">
        <div id="__abt_creativity_header">
          <div class="abt-section-label">Creativity</div>
          <span id="__abt_creativity_mode_label">Balanced</span>
        </div>
        <div id="__abt_creativity_track">
          <button class="creativity-seg" data-mode="0">Conservative</button>
          <button class="creativity-seg active mode-1" data-mode="1">Balanced</button>
          <button class="creativity-seg" data-mode="2">Experimental</button>
        </div>
        <div id="__abt_temp_bar">
          <div class="temp-dot" id="td0"></div>
          <div class="temp-dot" id="td1"></div>
          <div class="temp-dot" id="td2"></div>
          <div class="temp-dot" id="td3"></div>
          <div class="temp-dot" id="td4"></div>
          <span id="__abt_temp_label">temp 0.7</span>
        </div>
        <div id="__abt_creativity_desc">Mix of proven tactics and moderate innovation.</div>
      </div>

      <!-- Scan -->
      <button id="__abt_scan_btn">⚡ Scan &amp; Generate Ideas</button>

      <!-- Error -->
      <div id="__abt_error"></div>

      <!-- Results -->
      <div id="__abt_results_section">
        <hr class="abt-divider" />
        <div id="__abt_page_summary"></div>
        <div id="__abt_ideas_container"></div>
        <div id="__abt_dom_preview"></div>
      </div>

    </div>

    <!-- ── Footer ── -->
    <div id="__abt_footer">
      <span>GPT-4o Scanner v4.0</span>
      <a href="#" id="__abt_show_dom">View DOM snapshot</a>
    </div>
  `;

  document.body.appendChild(root);

  // ── Restore key ───────────────────────────────────────────
  const savedKey = sessionStorage.getItem(CFG.sessionKey) || "";
  if (savedKey) document.getElementById("__abt_apikey").value = savedKey;

  // ══════════════════════════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════════════════════════
  let selectedCtx   = "auto";
  let creativityMode = 1;
  let lastSnapshot   = null;

  // ══════════════════════════════════════════════════════════
  //  CREATIVITY TUNER
  // ══════════════════════════════════════════════════════════
  const tempDots = [0,1,2,3,4].map((i) => document.getElementById(`td${i}`));
  const dotCountMap = { 0: 2, 1: 3, 2: 5 };

  function applyCreativityMode(mode) {
    creativityMode = mode;
    const cfg = CREATIVITY_MODES[mode];

    // Segmented control
    document.querySelectorAll(".creativity-seg").forEach((s) => {
      s.classList.remove("active", "mode-0", "mode-1", "mode-2");
    });
    document.querySelector(`.creativity-seg[data-mode="${mode}"]`)
      ?.classList.add("active", `mode-${mode}`);

    // Text
    document.getElementById("__abt_creativity_mode_label").textContent = cfg.label;
    document.getElementById("__abt_creativity_desc").textContent = cfg.desc;
    document.getElementById("__abt_temp_label").textContent = `temp ${cfg.temperature}`;

    // Dots
    const litCount = dotCountMap[mode];
    tempDots.forEach((dot, i) => {
      dot.className = "temp-dot";
      if (i < litCount) dot.classList.add(`lit-${mode}`);
    });

    // Button tint
    const btn = document.getElementById("__abt_scan_btn");
    btn.classList.toggle("mode-warm", mode === 2);
  }

  document.querySelectorAll(".creativity-seg").forEach((seg) => {
    seg.addEventListener("click", () => applyCreativityMode(+seg.dataset.mode));
  });

  applyCreativityMode(1);

  // ══════════════════════════════════════════════════════════
  //  CONTEXT CHIPS
  // ══════════════════════════════════════════════════════════
  root.querySelectorAll(".ctx-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      root.querySelectorAll(".ctx-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCtx = chip.dataset.ctx;
    });
  });

  // ══════════════════════════════════════════════════════════
  //  TRAFFIC LIGHTS
  // ══════════════════════════════════════════════════════════
  document.querySelector(".abt-tl-close").addEventListener("click", () => {
    root.style.display = "none";
  });

  document.querySelector(".abt-tl-min").addEventListener("click", () => {
    const body   = document.getElementById("__abt_body");
    const footer = document.getElementById("__abt_footer");
    const collapsed = body.style.display === "none";
    body.style.display   = collapsed ? ""     : "none";
    footer.style.display = collapsed ? ""     : "none";
    root.style.height    = collapsed ? ""     : "auto";
  });

  document.querySelector(".abt-tl-max").addEventListener("click", () => {
    const preview = document.getElementById("__abt_dom_preview");
    if (lastSnapshot) {
      preview.textContent = lastSnapshot.rawStructure;
      preview.style.display = preview.style.display === "none" ? "block" : "none";
      document.getElementById("__abt_results_section").classList.add("visible");
    }
  });

  // ══════════════════════════════════════════════════════════
  //  SAVE KEY
  // ══════════════════════════════════════════════════════════
  document.getElementById("__abt_save_key").addEventListener("click", () => {
    const key = document.getElementById("__abt_apikey").value.trim();
    if (!key) return;
    sessionStorage.setItem(CFG.sessionKey, key);
    const btn = document.getElementById("__abt_save_key");
    btn.textContent = "✓ Saved";
    setTimeout(() => { btn.textContent = "Save"; }, 1600);
  });

  // ══════════════════════════════════════════════════════════
  //  DOM SNAPSHOT TOGGLE
  // ══════════════════════════════════════════════════════════
  document.getElementById("__abt_show_dom").addEventListener("click", (e) => {
    e.preventDefault();
    const preview = document.getElementById("__abt_dom_preview");
    if (lastSnapshot) {
      preview.textContent = lastSnapshot.rawStructure;
      preview.style.display = preview.style.display === "none" ? "block" : "none";
    }
  });

  // ══════════════════════════════════════════════════════════
  //  DRAG
  // ══════════════════════════════════════════════════════════
  let dragging = false, dragX = 0, dragY = 0;
  document.getElementById("__abt_header").addEventListener("mousedown", (e) => {
    if (e.target.closest(".abt-tl")) return;
    dragging = true;
    dragX = e.clientX - root.offsetLeft;
    dragY = e.clientY - root.offsetTop;
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    root.style.right = "auto";
    root.style.left  = (e.clientX - dragX) + "px";
    root.style.top   = (e.clientY - dragY) + "px";
  });
  document.addEventListener("mouseup", () => { dragging = false; });

  // ══════════════════════════════════════════════════════════
  //  MAIN: SCAN + GENERATE
  // ══════════════════════════════════════════════════════════
  document.getElementById("__abt_scan_btn").addEventListener("click", async () => {
    const apiKey  = document.getElementById("__abt_apikey").value.trim();
    const errDiv  = document.getElementById("__abt_error");
    const results = document.getElementById("__abt_results_section");
    const scanBtn = document.getElementById("__abt_scan_btn");

    errDiv.style.display = "none";
    results.classList.remove("visible");

    if (!apiKey) {
      errDiv.innerHTML = "⚠️  Please enter your OpenAI API key above.";
      errDiv.style.display = "block";
      return;
    }

    scanBtn.disabled = true;
    scanBtn.innerHTML = `<span class="spinner"></span> Scanning DOM…`;

    try {
      const snapshot = scanDOM();
      lastSnapshot   = snapshot;

      scanBtn.innerHTML = `<span class="spinner"></span> Generating ideas…`;
      const parsed = await fetchIdeas(apiKey, buildPrompt(snapshot, selectedCtx, adobe, creativityMode), creativityMode);

      // ── Page summary ─────────────────────────────────────
      document.getElementById("__abt_page_summary").innerHTML = `
        <div class="sum-eyebrow">Page Assessment</div>
        <div class="sum-text">${parsed.page_summary || ""}</div>
      `;

      // ── Idea cards ────────────────────────────────────────
      const container = document.getElementById("__abt_ideas_container");
      container.innerHTML = "";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "10px";

      (parsed.ideas || []).forEach((idea, i) => {
        const prioClass = idea.priority === "high" ? "high" : idea.priority === "mid" ? "mid" : "low";
        const card = document.createElement("div");
        card.className = "abt-idea-card";
        card.style.animationDelay = `${i * 65}ms`;

        card.innerHTML = `
          <!-- Row 1: number + title + badge -->
          <div class="abt-card-top">
            <span class="abt-idea-num">${String(idea.id || i + 1).padStart(2, "0")}</span>
            <span class="abt-idea-title">${idea.title}</span>
            <span class="abt-priority ${prioClass}">${idea.priority}</span>
          </div>

          <!-- Row 2: hypothesis -->
          <div class="abt-idea-hyp">${idea.hypothesis}</div>

          <!-- Row 3: control / variant block -->
          <div class="abt-cv-block">
            <div class="abt-cv-row">
              <span class="cv-pill ctrl">Ctrl</span>
              <span class="cv-text-ctrl">${idea.control}</span>
            </div>
            <div class="abt-cv-row">
              <span class="cv-pill var">Var</span>
              <span class="cv-text-var">${idea.variant}</span>
            </div>
          </div>

          <!-- Row 4: Adobe notes (conditional) -->
          ${idea.adobe_notes
            ? `<div class="abt-adobe-note">
                 <span class="note-icon">⬡</span>
                 ${idea.adobe_notes}
               </div>`
            : ""}

          <!-- Row 5: tags + copy -->
          <div class="abt-card-footer">
            <div class="abt-tags">
              <span class="abt-tag type">${idea.type}</span>
              <span class="abt-tag element">${idea.element}</span>
              <span class="abt-tag metric">↗ ${idea.primary_metric}</span>
              <span class="abt-tag effort">effort: ${idea.implementation_effort}</span>
            </div>
            <button class="abt-copy-btn" data-idx="${i}">Copy</button>
          </div>
        `;

        container.appendChild(card);
      });

      // Copy handlers
      container.querySelectorAll(".abt-copy-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(JSON.stringify(parsed.ideas[+btn.dataset.idx], null, 2));
          btn.textContent = "Copied!";
          setTimeout(() => { btn.textContent = "Copy"; }, 1600);
        });
      });

      results.classList.add("visible");
      scanBtn.innerHTML = "↺ Re-scan Page";

    } catch (err) {
      errDiv.textContent = `❌  ${err.message}`;
      errDiv.style.display = "block";
      scanBtn.innerHTML = "⚡ Scan &amp; Generate Ideas";
    }

    scanBtn.disabled = false;
  });

  console.log("%c✓ A/B Test Scanner v4 injected", "color:#0A84FF;font-weight:600;font-size:13px");
  console.log("%cdocument.getElementById('__abt_scanner_root').style.display='none'", "color:#666;font-size:11px");

  /*
   * ── BOOKMARKLET ────────────────────────────────────────────
   * javascript:(function(){const s=document.createElement('script');
   * s.src='https://YOUR_CDN/ab-test-scanner.js';
   * document.head.appendChild(s);})();
   */
})();
