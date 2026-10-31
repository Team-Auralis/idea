/**
 * TEST SUITE 6: WORKSPACES & SENSITIVITY SCENARIOS
 * Tests multi-project isolation, switching, duplication,
 * 3-scenario financial sensitivity modeling, and Mom Test protocol.
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== TEST SUITE 6: WORKSPACES & SENSITIVITY SCENARIOS ===\n');

const htmlContent = fs.readFileSync('D:\\idea\\index.html', 'utf8');
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) throw new Error('Could not find script block in index.html');
const code = scriptMatch[1]
    .replace(/^\s*\(\(\)\s*=>\s*\{[\r\n]*/, '')
    .replace(/[\r\n]*\}\)\(\);\s*$/, '');

class MockElement {
    constructor(tag, id = '') {
        this.tagName = tag.toUpperCase();
        this.id = id;
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
        this.dataset = {};
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
        getItem: k => storageBackend[k] !== undefined ? storageBackend[k] : null,
        setItem: (k, v) => { storageBackend[k] = String(v); },
        removeItem: k => { delete storageBackend[k]; },
        clear: () => { Object.keys(storageBackend).forEach(k => delete storageBackend[k]); }
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
            return elStore[sel] || (elStore[sel] = new MockElement('div', sel));
        },
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    confirm: () => true,
    prompt: (msg, def) => def,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {}
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

// Test 6.1: Workspace Manifest Initialization
console.log('Test 6.1: Workspace Manifest Initialization...');
const manifestRaw = sandbox.localStorage.getItem('auralis_workspace_manifest');
assert(manifestRaw, 'Workspace manifest must be created in localStorage');
const manifest = JSON.parse(manifestRaw);
assert(manifest.projects && manifest.projects.length >= 1, 'Manifest must have at least 1 project');
assert(manifest.activeId, 'Active project ID must be defined');
console.log('  Active Workspace ID:', manifest.activeId);
console.log('  Projects in Manifest:', manifest.projects.map(p => p.name).join(', '));
console.log('PASS: Workspace manifest initialized.\n');

// Test 6.2: Create New Project Workspace Isolation
console.log('Test 6.2: Create New Project Workspace Isolation...');
sandbox.createWorkspace('QuickCommerce Drone B2B');
const updatedManifest = JSON.parse(sandbox.localStorage.getItem('auralis_workspace_manifest'));
assert(updatedManifest.projects.length === 2, 'Should have 2 projects after creation');
assert(updatedManifest.activeId !== 'proj_default', 'Active ID should be the new project');
const newProjData = JSON.parse(sandbox.localStorage.getItem('auralis_proj_' + updatedManifest.activeId));
assert.strictEqual(newProjData.vals.app, 'QuickCommerce Drone B2B', 'New project name should match');
console.log('PASS: New workspace created with isolated storage.\n');

// Test 6.3: Duplicate Workspace
console.log('Test 6.3: Duplicate Current Workspace...');
sandbox.duplicateWorkspace();
const dupManifest = JSON.parse(sandbox.localStorage.getItem('auralis_workspace_manifest'));
assert(dupManifest.projects.length === 3, 'Should have 3 projects after duplication');
assert(dupManifest.projects.some(p => p.name.includes('(Copy)')), 'Should have (Copy) in duplicated name');
console.log('PASS: Workspace duplicated successfully.\n');

// Test 6.4: 3-Scenario Financial Sensitivity
console.log('Test 6.4: 3-Scenario Financial Sensitivity Modeling...');
const matrix = sandbox.getSensitivityMatrix();
assert(matrix.base && matrix.bull && matrix.bear, 'Must compute base, bull, and bear scenarios');
console.log('  Base Case ARPU: ₹' + matrix.base.mrp.toFixed(0) + ' | CM2: ₹' + matrix.base.cm2.toFixed(0) + ' | Payback: ' + matrix.base.paybackMonths + ' mo');
console.log('  Bull Case ARPU: ₹' + matrix.bull.mrp.toFixed(0) + ' | CM2: ₹' + matrix.bull.cm2.toFixed(0) + ' | Payback: ' + matrix.bull.paybackMonths + ' mo');
console.log('  Bear Case ARPU: ₹' + matrix.bear.mrp.toFixed(0) + ' | CM2: ₹' + matrix.bear.cm2.toFixed(0) + ' | Payback: ' + matrix.bear.paybackMonths + ' mo');

assert(matrix.bull.cm2 > matrix.base.cm2, 'Bull CM2 must exceed Base CM2');
assert(matrix.bear.cm2 < matrix.base.cm2, 'Bear CM2 must be lower than Base CM2');
assert(parseFloat(matrix.bull.paybackMonths) <= parseFloat(matrix.base.paybackMonths), 'Bull payback must be <= Base');
assert(parseFloat(matrix.bear.paybackMonths) >= parseFloat(matrix.base.paybackMonths), 'Bear payback must be >= Base');
console.log('PASS: 3-scenario sensitivity calculations validated.\n');

// Test 6.5: Dynamic Mom Test Protocol
console.log('Test 6.5: Dynamic Mom Test Discovery Protocol...');
const mom = sandbox.getMomTestProtocol();
assert(mom.questions && mom.questions.length === 5, 'Should generate 5 past-tense questions');
assert(mom.killRule && mom.killRule.includes('Stop or pivot'), 'Should generate concrete falsifiable kill rule');
assert(mom.questions[0].startsWith('When was the last time'), 'Mom test questions must be past-tense');
console.log('  Kill Rule Sample: ' + mom.killRule);
console.log('PASS: Mom Test Protocol generated with zero hypothetical bias.\n');

console.log('=== ALL SUITE 6 TESTS PASSED! ===');
