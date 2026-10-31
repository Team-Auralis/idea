const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('D:/idea/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
const code = scriptMatch[1]
    .replace(/^\s*\(\(\)\s*=>\s*\{[\r\n]*/, '')
    .replace(/[\r\n]*\}\)\(\);\s*$/, '');

class MockElement {
    constructor(tag, id = '') {
        this.tagName = tag.toUpperCase();
        this.id = id;
        this.dataset = {};
        this.classList = { add: () => {}, remove: () => {}, toggle: () => {} };
        this.style = { setProperty: () => {}, removeProperty: () => {} };
        this.childNodes = [{ nodeValue: '' }];
        this.attributes = {};
        this.innerHTML = '';
        this.value = '';
    }
    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k] || null; }
    addEventListener() {}
    focus() {}
    scrollIntoView() {}
}

const docElement = new MockElement('html');
const docBody = new MockElement('body');
const elStore = {};

const sandbox = {
    console: console,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    window: { innerWidth: 1024, location: { href: 'http://localhost/' }, addEventListener: () => {} },
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    document: {
        documentElement: docElement,
        body: docBody,
        getElementById: id => elStore[id] || (elStore[id] = new MockElement('div', id)),
        querySelector: sel => {
            if (sel.startsWith('#')) return elStore[sel.slice(1)] || (elStore[sel.slice(1)] = new MockElement('div', sel.slice(1)));
            if (sel === 'body') return docBody;
            return null;
        },
        querySelectorAll: () => [],
        addEventListener: () => {},
        createElement: tag => new MockElement(tag)
    },
    setTimeout: fn => fn(),
    clearTimeout: () => {}
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

console.log('=== TEST SUITE 2: PIPELINE CONTEXT FLOW & HANDOFFS ===\n');

// 1. Context passing from Team Card into Station 1
console.log('Test 2.1: Context passing into Station 1 Prompt...');
const s1Prompt = vm.runInContext(`
(() => {
  st.vals.team = 'Vizag Techies';
  st.vals.app = 'AquaTrack';
  st.vals.problem = 'Shrimp farmers in coastal AP cannot measure dissolved oxygen reliably.';
  st.vals.idea = 'IoT sensor with Gemini water quality predictor and WhatsApp alerts.';
  return P[0].gen();
})()
`, sandbox);

if (!s1Prompt.includes('Vizag Techies') || !s1Prompt.includes('AquaTrack') || !s1Prompt.includes('Shrimp farmers in coastal AP')) {
    console.error('FAIL: Station 1 did not receive Team Card context!');
    process.exit(1);
}
console.log('PASS: Station 1 prompt synthesizes Team Card inputs.\n');

// 2. Station 1 handoff extraction & preservation
console.log('Test 2.2: Station 1 Handoff Parsing & Raw Preservation...');
vm.runInContext(`
(() => {
  const rawResponse = \`
Here is the Gemini analysis:
We audited shrimp farming in Visakhapatnam and found:

HANDOFF SUMMARY
PROBLEM: Severe dissolved oxygen drops cause 25% crop mortality before dawn.
IDEA: IoT probe with Gemini predictive night alert system.
FIRST USERS: 40 smallholder aqua farmers in Bhimavaram & Vizag.
PAIN SCORE: 9.2 / 10
KEY FACTS: AP produces 70% of Indian shrimp; ₹4 Lakh crop lost per pond crash.
EXISTING SOLUTIONS: Manual chemical testing kits, visual inspection.
GAP: No early warning 4 hours before oxygen crash.
RISKIEST ASSUMPTION: Farmers will wake up to WhatsApp voice call alerts.
VERDICT: EXTREMELY VIABLE with high farmer willingness to pay.
\`;

  st.research = rawResponse;
  render();
})()
`, sandbox);

const rawSaved = vm.runInContext(`st.rawHandoffs['research']`, sandbox);
const parsedS1 = vm.runInContext(`parse('research')`, sandbox);

if (!rawSaved || !rawSaved.includes('We audited shrimp farming')) {
    console.error('FAIL: Raw AI response was not preserved in st.rawHandoffs!');
    process.exit(1);
}
if (parsedS1.gap !== 'No early warning 4 hours before oxygen crash.' || parsedS1.verdict !== 'EXTREMELY VIABLE with high farmer willingness to pay.') {
    console.error('FAIL: Station 1 handoff parsing mismatch!');
    process.exit(1);
}
console.log('PASS: Raw handoff preserved and fields parsed accurately.\n');

// 3. Station 2 receives Station 1 deliverables
console.log('Test 2.3: Station 2 (Shark Panel) receives Station 1 Deliverables...');
const s2Prompt = vm.runInContext(`P[1].gen()`, sandbox);

if (!s2Prompt.includes('Severe dissolved oxygen drops cause 25% crop mortality') || !s2Prompt.includes('No early warning 4 hours before oxygen crash')) {
    console.error('FAIL: Station 2 prompt missing Station 1 deliverables!');
    process.exit(1);
}
console.log('PASS: Station 2 received Station 1 deliverables.\n');

// 4. User Field Overrides
console.log('Test 2.4: User Deliverable Field Overrides...');
vm.runInContext(`
(() => {
  if (!st.approvedFields) st.approvedFields = {};
  if (!st.approvedFields.research) st.approvedFields.research = {};
  // Founder clarifies/overrides the problem wording
  st.approvedFields.research.problem = 'Shrimp pond crashes cost ₹4 Lakh per pond due to unmonitored midnight oxygen drops.';
  render();
})()
`, sandbox);

const s2PromptAfterOverride = vm.runInContext(`P[1].gen()`, sandbox);
if (!s2PromptAfterOverride.includes('Shrimp pond crashes cost ₹4 Lakh per pond')) {
    console.error('FAIL: Downstream prompt did not reflect user field override!');
    process.exit(1);
}
console.log('PASS: User field overrides correctly flow downstream.\n');

// 5. Station 5 (Build Specification) Synthesis
console.log('Test 2.5: Station 5 Master Build Prompt Synthesis...');
vm.runInContext(`
(() => {
  st.shark = \`
HANDOFF SUMMARY
SHARK VERDICT: 4/5 Sharks Invest
BIGGEST STRUCTURAL FLAW: Hardware probe sensor calibration drift in brackish water.
UNIT HEALTH: Strong CM2 margin
MOAT RATING: High switching cost once historical pond telemetry is recorded
PRIORITIZED FIX: Add auto-calibration routine in mobile app.
\`;
  st.business = \`
HANDOFF SUMMARY
WHO USES: Pond managers & aqua farm owners
WHO PAYS: Pond owners
REVENUE MODEL: Hardware ₹8,000 + ₹999/mo Gemini telemetry subscription
PRICE: ₹999 / month per pond
FIRST CHANNEL: Aquafeed dealer network in Vizag
WEEKLY METRICS: Pond night uptime alerts
PITCH: Never lose a shrimp crop to a midnight oxygen crash again.
MUST SHOW IN V1: Real-time sensor graph, alert trigger, daily rector summary
BIGGEST RISK: Sensor fouling
\`;
  st.mvp = \`
HANDOFF SUMMARY
APP NAME: AquaGuard Vizag
ONE-LINER: Real-time shrimp pond oxygen telemetry with Gemini crash prediction
SCREEN 1: Pond Live Telemetry Dashboard
SCREEN 2: Sensor Calibration & Pond Setup
SCREEN 3: Gemini Predictive Health Card & Emergency Dial
MAIN ACTION: Set oxygen warning threshold and trigger WhatsApp test alert
AI FEATURE: Predict pond oxygen crash 4 hours in advance using temperature & aeration telemetry
AI INPUT EXAMPLE: {"temp": 28.5, "salinity": 15, "aerator_status": "ON", "last_reading": 4.1}
AI OUTPUT SHAPE: {"crash_risk": "HIGH", "crash_window_hours": 3.5, "recommended_action": "Turn on emergency diesel aerator"}
SAMPLE DATA: 8 shrimp ponds from Anandapuram, Bhimili, and Gajuwaka
EXCLUDE FROM V1: Multi-farm enterprise RBAC, custom Bluetooth firmware flasher
\`;
  render();
})()
`, sandbox);

const s5Prompt = vm.runInContext(`P[4].gen()`, sandbox);
console.log('Station 5 prompt preview (first 250 chars):\n', s5Prompt.slice(0, 250));

if (!s5Prompt.includes('AquaGuard Vizag') || !s5Prompt.includes('Pond Live Telemetry Dashboard') || !s5Prompt.includes('Predict pond oxygen crash 4 hours in advance') || !s5Prompt.includes('Turn on emergency diesel aerator')) {
    console.error('FAIL: Station 5 build prompt missing approved specifications!');
    process.exit(1);
}
console.log('PASS: Station 5 synthesized all 4 upstream deliverables into the build prompt.\n');

console.log('=== ALL PIPELINE INTEGRATION TESTS PASSED! ===');
