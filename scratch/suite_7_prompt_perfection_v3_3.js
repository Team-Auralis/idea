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

console.log('=== TEST SUITE 7: PROMPT PERFECTION & RUNNER ARCHITECTURE (v3.3) ===\n');

// Test 7.1: Station 3 XML Structural Tag Framing
console.log('Test 7.1: Station 3 XML Structural Tag Framing...');
const s3Prompt = vm.runInContext(`P[2].gen()`, sandbox);

const s3Tags = [
    '<role_definition>',
    '<user_vs_buyer_bifurcation>',
    '<inr_3_tier_pricing_ladder',
    '<zero_dollar_gtm_distribution_playbook',
    '<the_60sec_investor_pitch>'
];

s3Tags.forEach(tag => {
    if (!s3Prompt.includes(tag)) {
        console.error(`FAIL: Station 3 prompt missing XML tag: ${tag}`);
        process.exit(1);
    }
});
console.log('PASS: Station 3 incorporates all XML structural tags and pricing psychology.\n');

// Test 7.2: Station 5 Design System & Aesthetic Tokens
console.log('Test 7.2: Station 5 Design System & Aesthetic Tokens...');
const s5Prompt = vm.runInContext(`P[4].gen()`, sandbox);

if (!s5Prompt.includes('<design_system_and_aesthetic_tokens>') || !s5Prompt.includes('--bg: #090d16') || !s5Prompt.includes('Global Error Boundary')) {
    console.error('FAIL: Station 5 missing design tokens or error boundary directives!');
    process.exit(1);
}
console.log('PASS: Station 5 specifies full CSS custom properties and tactile interaction anchor.\n');

// Test 7.3: Target AI Runner Switching (Claude Artifacts)
console.log('Test 7.3: Target AI Runner Switching (Claude Artifacts)...');
vm.runInContext(`
(() => {
  st.targetRunner = 'claude';
  build();
})()
`, sandbox);
const claudePrompt = vm.runInContext(`P[4].gen()`, sandbox);
if (!claudePrompt.includes('Anthropic Claude 3.5 Sonnet Artifact')) {
    console.error('FAIL: Claude Artifact runner directive not injected into Master Build prompt!');
    process.exit(1);
}
console.log('PASS: Claude 3.5 Artifact runner directive active and verified.\n');

// Test 7.4: Target AI Runner Switching (v0.dev / Bolt)
console.log('Test 7.4: Target AI Runner Switching (v0.dev / Bolt.new)...');
vm.runInContext(`
(() => {
  st.targetRunner = 'v0';
  build();
})()
`, sandbox);
const v0Prompt = vm.runInContext(`P[4].gen()`, sandbox);
if (!v0Prompt.includes('v0.dev / Bolt.new (React + Tailwind)')) {
    console.error('FAIL: v0.dev runner directive not injected into Master Build prompt!');
    process.exit(1);
}
console.log('PASS: v0.dev / Bolt.new React component directive active and verified.\n');

// Test 7.5: Target AI Runner Switching (ChatGPT Canvas)
console.log('Test 7.5: Target AI Runner Switching (ChatGPT Canvas)...');
vm.runInContext(`
(() => {
  st.targetRunner = 'chatgpt';
  build();
})()
`, sandbox);
const gptPrompt = vm.runInContext(`P[4].gen()`, sandbox);
if (!gptPrompt.includes('ChatGPT Canvas (GPT-4o)')) {
    console.error('FAIL: ChatGPT Canvas runner directive not injected into Master Build prompt!');
    process.exit(1);
}
console.log('PASS: ChatGPT Canvas runner directive active and verified.\n');

console.log('=== ALL 5 SUITE 7 TESTS PASSED! ===');
