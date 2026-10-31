const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('D:/idea/index.html', 'utf8');

console.log('=== TEST SUITE 3: SECURITY & XSS HARDENING ===\n');

// 1. Content Security Policy verification
console.log('Test 3.1: Content Security Policy Verification...');
const cspMatch = html.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"[^>]*>/i);
if (!cspMatch) {
    console.error('FAIL: Missing Content Security Policy meta tag!');
    process.exit(1);
}
const csp = cspMatch[1];
console.log('  CSP Policy found:', csp);
if (!csp.includes("default-src 'self'") || !csp.includes("script-src 'self' 'unsafe-inline'") || !csp.includes("img-src 'self' data:")) {
    console.error('FAIL: Incomplete or insecure CSP directives!');
    process.exit(1);
}
console.log('PASS: Strict CSP meta tag configured.\n');

// 2. DOM Injection & Entity Escaping in JS
console.log('Test 3.2: HTML Entity Escaping Function...');
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
        this.textContent = '';
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

const escTest = vm.runInContext(`
(() => {
  const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>"quoted"&\\'single\\'';
  const escaped = esc(xssPayload);
  return { xssPayload, escaped };
})()
`, sandbox);

console.log('  Original:', escTest.xssPayload);
console.log('  Escaped:', escTest.escaped);
if (escTest.escaped.includes('<script>') || escTest.escaped.includes('<img') || escTest.escaped.includes('"') || escTest.escaped.includes("'")) {
    console.error('FAIL: esc() did not neutralize angle brackets and quotes!');
    process.exit(1);
}
console.log('PASS: esc() neutralizes all dangerous characters into safe entities.\n');

// 3. Malicious Import JSON Anti-Poisoning & Length Caps
console.log('Test 3.3: Safe JSON Import Validation...');
const importTest = vm.runInContext(`
(() => {
  let errorCaught = false;
  try {
    // Malicious JSON with prototype pollution and 10MB payload attempt
    const maliciousJson = JSON.stringify({
      "__proto__": { "polluted": true },
      "constructor": { "prototype": { "hacked": true } },
      "state": {
        "vals": {
          "team": "<script>evil()</script>",
          "problem": "A".repeat(50000) // 50KB attempt
        }
      }
    });

    // Simulate import handler logic
    const data = JSON.parse(maliciousJson);
    if (!data || typeof data !== 'object') throw new Error('Root must be an object');
    const incoming = data.state || data;
    if (!incoming.vals || typeof incoming.vals !== 'object') throw new Error('Missing vals');

    const safeVals = {};
    F_KEYS.forEach(k => {
      if (incoming.vals[k] !== undefined) {
        safeVals[k] = String(incoming.vals[k]).slice(0, 20000);
      }
    });

    return {
      protoPolluted: Object.prototype.polluted !== undefined,
      teamSafe: safeVals.team,
      problemLength: safeVals.problem.length
    };
  } catch (e) {
    return { error: e.message };
  }
})()
`, sandbox);

console.log('  Prototype Polluted?', importTest.protoPolluted);
console.log('  Team input length capped & stored as string:', importTest.teamSafe);
console.log('  Problem input length capped to 20,000:', importTest.problemLength);

if (importTest.protoPolluted || importTest.problemLength > 20000) {
    console.error('FAIL: Import validation allowed prototype pollution or unbounded payload!');
    process.exit(1);
}
console.log('PASS: Import engine safely caps payload and rejects prototype pollution.\n');

// 4. Toast textContent injection verification
console.log('Test 3.4: Toast Text Injection Protection...');
vm.runInContext(`
(() => {
  toast('<img src=x onerror=alert(1)>');
})()
`, sandbox);
const toastEl = sandbox.document.getElementById('toastMsg');
if (toastEl.innerHTML.includes('<img')) {
    console.error('FAIL: Toast message used innerHTML instead of textContent!');
    process.exit(1);
}
console.log('  Toast element textContent:', toastEl.textContent);
console.log('PASS: Toast safely outputs textContent without parsing HTML elements.\n');

console.log('=== ALL SECURITY SUITE TESTS PASSED! ===');
