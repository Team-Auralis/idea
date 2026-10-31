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

console.log('=== TEST SUITE 1: SECTOR FINANCIAL ENGINE VALIDATION ===\n');

// 1. D2C Model Test
console.log('Test 1.1: D2C Model...');
const d2cTest = vm.runInContext(`
(() => {
  st.vals.sector = 'd2c';
  st.vals.mrp = '499';
  st.vals.cogs = '120';
  st.vals.ship = '50';
  st.vals.cac = '100';
  const u = getUnitMath();
  return u;
})()
`, sandbox);

console.log('  D2C MRP:', d2cTest.mrp);
console.log('  D2C CM1 (Gross):', d2cTest.cm1, '(' + d2cTest.grossMarginPct.toFixed(1) + '%)');
console.log('  D2C Logistics (incl 20% RTO reverse):', d2cTest.totalLogistics);
console.log('  D2C CM2 (Delivered):', d2cTest.cm2);
console.log('  D2C CM3 (Net after CAC):', d2cTest.cm3);
console.log('  D2C Breakeven Units:', d2cTest.breakEvenUnits, '/mo');

if (d2cTest.cm1 !== 379 || Math.round(d2cTest.totalLogistics) !== 68 || Math.round(d2cTest.cm2) !== 301 || Math.round(d2cTest.cm3) !== 201) {
    console.error('FAIL: D2C calculation mismatch!');
    process.exit(1);
}
console.log('PASS: D2C unit economics validated.\n');

// 2. SaaS Model Test
console.log('Test 1.2: SaaS & AI Wrapper Model...');
const saasTest = vm.runInContext(`
(() => {
  st.vals.sector = 'saas';
  st.vals.mrp = '299';
  st.vals.cogs = '45';
  st.vals.ship = '0';
  st.vals.cac = '150';
  const u = getUnitMath();
  return u;
})()
`, sandbox);

console.log('  SaaS ARPU:', saasTest.mrp);
console.log('  SaaS Cloud/API COGS:', saasTest.cogs);
console.log('  SaaS CM1 (Gross Margin):', saasTest.cm1, '(' + saasTest.grossMarginPct.toFixed(1) + '%)');
console.log('  SaaS CM2 (Monthly Cashflow):', saasTest.cm2);
console.log('  SaaS Payback Period:', saasTest.paybackMonths, 'months');
console.log('  SaaS Breakeven Subscribers:', saasTest.breakEvenUnits, 'users');

if (saasTest.cm1 !== 254 || Math.round(saasTest.cm2) !== 248 || saasTest.paybackMonths !== '0.6' || saasTest.breakEvenUnits !== 61) {
    console.error('FAIL: SaaS calculation mismatch!');
    process.exit(1);
}
console.log('PASS: SaaS unit economics & payback period validated.\n');

// 3. Marketplace Model Test
console.log('Test 1.3: Marketplace & Platform Model...');
const marketTest = vm.runInContext(`
(() => {
  st.vals.sector = 'marketplace';
  st.vals.mrp = '800'; // AOV
  st.vals.cogs = '15';  // Take rate %
  st.vals.ship = '20';  // Delivery subsidy
  st.vals.cac = '40';   // Blended CAC
  const u = getUnitMath();
  return u;
})()
`, sandbox);

console.log('  Marketplace AOV:', marketTest.mrp);
console.log('  Platform Commission Take:', marketTest.cm1);
console.log('  Marketplace CM2 (Order Margin):', marketTest.cm2);
console.log('  Marketplace CM3 (Net / Order):', marketTest.cm3);
console.log('  Marketplace Breakeven Orders:', marketTest.breakEvenUnits, '/mo');

if (marketTest.cm1 !== 120 || marketTest.cm2 !== 84 || marketTest.cm3 !== 44 || marketTest.breakEvenUnits !== 341) {
    console.error('FAIL: Marketplace calculation mismatch!');
    process.exit(1);
}
console.log('PASS: Marketplace unit economics validated.\n');

// 4. B2B & Enterprise Services Test
console.log('Test 1.4: B2B Enterprise Model...');
const b2bTest = vm.runInContext(`
(() => {
  st.vals.sector = 'b2b';
  st.vals.mrp = '100000'; // ACV
  st.vals.cogs = '15000';  // Onboarding
  st.vals.ship = '5000';   // SLA/Maintenance
  st.vals.cac = '20000';   // Enterprise CAC
  const u = getUnitMath();
  return u;
})()
`, sandbox);

console.log('  B2B ACV:', b2bTest.mrp);
console.log('  B2B CM1 (Gross Contract Margin):', b2bTest.cm1, '(' + b2bTest.grossMarginPct.toFixed(1) + '%)');
console.log('  B2B CM2 (Delivered Margin):', b2bTest.cm2);
console.log('  B2B CM3 (Net Deal Margin):', b2bTest.cm3);
console.log('  B2B Breakeven Deals/Year:', b2bTest.breakEvenUnits);

if (b2bTest.cm1 !== 85000 || b2bTest.cm2 !== 80000 || b2bTest.cm3 !== 60000 || b2bTest.breakEvenUnits !== 3) {
    console.error('FAIL: B2B calculation mismatch!');
    process.exit(1);
}
console.log('PASS: B2B enterprise economics validated.\n');

// 5. Boundary & Zero Values Test
console.log('Test 1.5: Zero & Negative Value Boundaries...');
const zeroTest = vm.runInContext(`
(() => {
  st.vals.sector = 'd2c';
  st.vals.mrp = '0';
  st.vals.cogs = '0';
  st.vals.ship = '0';
  st.vals.cac = '0';
  const u = getUnitMath();
  return u;
})()
`, sandbox);

if (zeroTest.mrp !== 0 || zeroTest.cogs !== 0 || zeroTest.cm1 !== 0 || zeroTest.breakEvenUnits !== Infinity) {
    console.error('FAIL: Zero boundary handled incorrectly!');
    process.exit(1);
}
console.log('PASS: Zero value boundaries handled without crashing or defaulting.\n');

console.log('=== ALL 5 FINANCIAL SUITE TESTS PASSED! ===');
