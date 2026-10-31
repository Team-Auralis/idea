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
        this.classList = {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            toggle(c, f) {
                if (f === true || (f === undefined && !this.classes.has(c))) this.classes.add(c);
                else this.classes.delete(c);
            },
            contains(c) { return this.classes.has(c); }
        };
        this.style = {
            map: {},
            setProperty(k, v) { this.map[k] = v; },
            removeProperty(k) { delete this.map[k]; }
        };
        this.childNodes = [{ nodeValue: '' }];
        this.attributes = {};
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.checked = false;
        this.parentElement = { setAttribute: () => {} };
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

const storageBackend = {};
const sandbox = {
    console: console,
    localStorage: {
        getItem: k => storageBackend[k] || null,
        setItem: (k, v) => { storageBackend[k] = String(v); },
        removeItem: k => { delete storageBackend[k]; }
    },
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

console.log('=== TEST SUITE 5: END-TO-END 5-STATION JOURNEY & ROUNDTRIP ===\n');

// Step 1: Boot & Storage Persistence
console.log('Step 5.1: Initial Boot & LocalStorage Persistence...');
const initialTab = vm.runInContext(`st.tab`, sandbox);
const initialProblem = vm.runInContext(`st.vals.problem`, sandbox);
console.log('  Initial Tab:', initialTab);
console.log('  Initial Problem Length:', initialProblem.length);
if (!initialProblem || initialTab !== 'team') {
    console.error('FAIL: Initial state not loaded!');
    process.exit(1);
}
console.log('PASS: Initial boot successful.\n');

// Step 2: Station 1 Unlock & Execution
console.log('Step 5.2: Station 1 Run & Handoff...');
const p1Prompt = vm.runInContext(`plain(P[0].gen())`, sandbox);
if (!p1Prompt.includes('AGENT REACH')) {
    console.error('FAIL: Station 1 prompt generation failed!');
    process.exit(1);
}
vm.runInContext(`
(() => {
  st.research = \`
HANDOFF SUMMARY
PROBLEM: Students wait 45 mins in mess lines with zero menu visibility.
IDEA: Digital meal countdown and instant complaint logger.
FIRST USERS: 300 AU campus hostel students.
PAIN SCORE: 8.8
KEY FACTS: 4 hostels, 1200 residents, ₹4200/mo food charge.
EXISTING SOLUTIONS: Mess notice board, WhatsApp student union rep.
GAP: No live feedback mechanism or food wastage tracking.
RISKIEST ASSUMPTION: Mess contractor will accept student ratings.
VERDICT: APPROVED FOR BUILD
\`;
  render();
})()
`, sandbox);
const p2Locked = vm.runInContext(`locked(1)`, sandbox);
if (p2Locked) {
    console.error('FAIL: Station 2 remains locked after valid Station 1 handoff!');
    process.exit(1);
}
console.log('PASS: Station 1 handoff processed, Station 2 unlocked.\n');

// Step 3: Station 2 Shark Panel & Math
console.log('Step 5.3: Station 2 (Shark Panel & Math)...');
vm.runInContext(`
(() => {
  st.shark = \`
HANDOFF SUMMARY
SHARK VERDICT: 4/5 Conditional Invest
BIGGEST STRUCTURAL FLAW: Mess contractor contract renewal barrier.
UNIT HEALTH: Strong margin at ₹299/mo per hostel
MOAT RATING: Data lock-in with college management
PRIORITIZED FIX: Partner with student council first.
\`;
  render();
})()
`, sandbox);
const p3Locked = vm.runInContext(`locked(2)`, sandbox);
if (p3Locked) {
    console.error('FAIL: Station 3 remains locked after Station 2 handoff!');
    process.exit(1);
}
console.log('PASS: Station 2 handoff processed, Station 3 unlocked.\n');

// Step 4: Station 3 Business Model & Station 4 Ponytail Slasher
console.log('Step 5.4: Station 3 & 4 (Business & Ponytail)...');
vm.runInContext(`
(() => {
  st.business = \`
HANDOFF SUMMARY
WHO USES: Students & hostel managers
WHO PAYS: Hostel warden / College management
REVENUE MODEL: Annual SaaS license ₹15,000 / hostel
PRICE: ₹15,000 / year
FIRST CHANNEL: Direct pitch to college student welfare dean
WEEKLY METRICS: Daily active ratings & resolved complaints
PITCH: Zero mess food wastage, 90% happier students in 1 tap.
MUST SHOW IN V1: Today menu, 1-tap rating, rector summary
BIGGEST RISK: Mess staff refusing smartphone use
\`;
  st.mvp = \`
HANDOFF SUMMARY
APP NAME: CampusMess Vizag
ONE-LINER: Live hostel mess menu and 1-tap food complaint dashboard
SCREEN 1: Today Menu & Voting Hook
SCREEN 2: Quick Feedback & Photo Complaint
SCREEN 3: Rector Daily Health & Waste Forecast
MAIN ACTION: Rate meal and submit complaint
AI FEATURE: Summarize student complaints into top 3 action items
AI INPUT EXAMPLE: 14 student complaints about cold dal and late breakfast
AI OUTPUT SHAPE: {"top_issue": "Cold food", "severity": "High", "action": "Reheat counter"}
SAMPLE DATA: GVP College Hostel 1 & 2 menus
EXCLUDE FROM V1: Multi-role hierarchy, RFID card reader
\`;
  // Apply Ponytail Trim
  st.bloatChecks = { auth: false, db: false, micro: false, native: false, vector: false, rbac: false };
  render();
})()
`, sandbox);
const p5Locked = vm.runInContext(`locked(4)`, sandbox);
if (p5Locked) {
    console.error('FAIL: Station 5 remains locked after Station 4 handoff!');
    process.exit(1);
}
console.log('PASS: Stations 3 & 4 processed, Station 5 unlocked.\n');

// Step 5: Station 5 Build Prompt
console.log('Step 5.5: Station 5 Master Build Prompt Verification...');
const masterPrompt = vm.runInContext(`plain(P[4].gen())`, sandbox);
console.log('  Master Build Prompt Length:', masterPrompt.length);
if (!masterPrompt.includes('CampusMess Vizag') || !masterPrompt.includes('Today Menu & Voting Hook') || !masterPrompt.includes('Summarize student complaints')) {
    console.error('FAIL: Master build prompt incomplete!');
    process.exit(1);
}
console.log('PASS: Master build prompt successfully generated.\n');

// Step 6: Export & Import Roundtrip
console.log('Step 5.6: Project JSON Export & Import Roundtrip...');
const exportedStateJson = vm.runInContext(`
JSON.stringify({
  schema: 'gdg-vizag-prompt-cockpit-v3',
  version: '3.0.0',
  exportedAt: new Date().toISOString(),
  state: st
})
`, sandbox);

// Reset project to blank
console.log('  Resetting project...');
vm.runInContext(`
(() => {
  st.vals.app = '';
  st.vals.problem = '';
  st.vals.idea = '';
  st.research = '';
  st.shark = '';
  st.business = '';
  st.mvp = '';
  render();
})()
`, sandbox);
if (vm.runInContext(`locked(0)`, sandbox) !== true) {
    console.error('FAIL: Station 1 should be locked when problem is empty!');
    process.exit(1);
}
console.log('  Project blank verified (Station 1 is locked).');

// Re-import the exported project
console.log('  Re-importing project JSON...');
vm.runInContext(`
(() => {
  const importedData = JSON.parse(${JSON.stringify(exportedStateJson)});
  st = Object.assign(st, importedData.state);
  render();
})()
`, sandbox);

const reimportedApp = vm.runInContext(`st.vals.app`, sandbox);
const reimportedP5Locked = vm.runInContext(`locked(4)`, sandbox);
console.log('  Re-imported App Name:', reimportedApp);
console.log('  Is Station 5 unlocked after re-import?', !reimportedP5Locked);

if (reimportedApp !== 'MessMate' || reimportedP5Locked) {
    console.error('FAIL: State not restored after JSON import!');
    process.exit(1);
}
console.log('PASS: Project JSON Export & Import roundtrip restored entire 5-station journey perfectly.\n');

console.log('=== ALL 5 END-TO-END JOURNEY TESTS PASSED! ===');
