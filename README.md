# cro-ai-scanner

AI-powered DOM scanner that analyzes any webpage and generates prioritized A/B test hypotheses using GPT-4o, with native hooks for Adobe Analytics, AEM, and Adobe Target.

---

## What It Does

Inject `ab-test-scanner.js` into any page via the browser console and a floating panel appears. It scans the live DOM — headlines, CTAs, forms, price elements, badges, and page structure — then sends that snapshot to GPT-4o and returns 6 structured A/B test ideas in seconds.

Each idea includes:
- Hypothesis in the **"If we... then... because..."** format
- Control vs. Variant description
- Primary metric + secondary metrics
- Implementation effort rating (low / medium / high)
- Adobe-specific notes when Adobe stack is detected

---

## Adobe Stack Detection

The scanner automatically detects and extracts data from Adobe tools if they are present on the page:

| Tool | Detection Method |
|------|-----------------|
| Adobe Analytics | `window.s`, `window.s_gi`, `window.digitalData` — eVars, props, events, pageName |
| Adobe Launch | `window._satellite` |
| Adobe Target | `window.adobe.target`, mbox DOM elements |
| AEM Components | `data-cq-component`, `data-component`, `.cmp-*` class pattern |
| AEM Data Layer | `window.adobeDataLayer` — Core Components standard |

When detected, this data is injected into the prompt so GPT-4o can write test ideas that reference your actual analytics variables and AEM component structure.

---

## Usage

**1. Add your OpenAI API key**

Open `ab-test-scanner.js` and replace the placeholder:

```js
const PRESET_KEY = "REPLACE WITH API KEY";
```

**2. Inject into any page**

Open DevTools on the page you want to analyze, paste the entire contents of `ab-test-scanner.js` into the console, and press Enter.

**3. Scan**

- Select a **Page Context** (auto, rental, ecommerce, saas, content, homepage)
- Click **⚡ Scan & Generate Ideas**
- Results appear in the panel with copy-to-clipboard per idea

The panel is draggable and resizable. Minimize it with `—` or close with `✕`. To re-show after closing:

```js
document.getElementById('__abt_scanner_root').style.display = 'flex'
```

---

## Page Context Options

| Context | Focus |
|---------|-------|
| `auto` | GPT-4o infers page type from DOM |
| `rental` | Vehicle rental / fleet listing — booking conversion |
| `ecommerce` | Product / listing pages — purchase conversion |
| `saas` | B2B / SaaS landing pages — lead gen, sign-up |
| `content` | Editorial pages — engagement, scroll depth |
| `homepage` | Homepages — user routing, first-impression clarity |

---

## Output Format

Each idea is returned as structured JSON and rendered as a card in the panel. Use the **copy** button on any card to copy the full JSON to clipboard.

```json
{
  "id": 1,
  "title": "CTA Button Copy Test",
  "priority": "high",
  "type": "copy",
  "element": ".btn-reserve, button[data-action='book']",
  "hypothesis": "If we change the CTA from 'Reserve' to 'Reserve My Car' then click-through rate will improve because possessive language increases perceived commitment and reduces hesitation.",
  "control": "Generic 'Reserve' button label",
  "variant": "'Reserve My Car' with first-person possessive framing",
  "primary_metric": "CTA click-through rate",
  "secondary_metrics": ["booking completion rate", "time on page"],
  "implementation_effort": "low",
  "adobe_notes": "Track via eVar10 click event; use Adobe Target mbox on .btn-reserve for split delivery"
}
```

---

## Requirements

- Modern browser with DevTools access
- OpenAI API key with GPT-4o access (`sk-proj-...`)
- No build step, no dependencies — single vanilla JS file

---

## Roadmap

- [ ] README localization for Adobe Analytics Reporting API integration
- [ ] Pull live conversion data to auto-prioritize ideas by impact
- [ ] Export ideas to CSV / Jira ticket format
- [ ] Bookmarklet version for one-click injection

---

## Author

**Ramsey Lewis** — CRO & MarTech Engineer  
[GitHub: RamseyJLewis](https://github.com/RamseyJLewis)

---

## License

MIT
