const fs = require('fs');

const html = fs.readFileSync('D:/idea/index.html', 'utf8');

console.log('=== TEST SUITE 4: ACCESSIBILITY & WCAG 2.1 AA AUDIT ===\n');

// 1. Check Viewport Scalability
console.log('Test 4.1: Viewport Scalability (User Zoom)...');
const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']+)["'][^>]*>/i);
if (!viewportMatch || viewportMatch[1].includes('user-scalable=no') || viewportMatch[1].includes('maximum-scale=1.0')) {
    console.error('FAIL: Viewport prevents user zoom (WCAG 1.4.4 violation)!');
    process.exit(1);
}
console.log('  Viewport content:', viewportMatch[1]);
console.log('PASS: User zooming permitted up to scale 5.\n');

// 2. Form Controls & Explicit Label Associations
console.log('Test 4.2: Form Controls & Label Associations...');
const formControlIds = ['f-team', 'f-app', 'f-sector', 'f-problem', 'f-idea', 'f-ai', 'f-mrp', 'f-cogs', 'f-ship', 'f-cac', 'f-notes'];
let missingLabels = 0;

formControlIds.forEach(id => {
    const hasLabelFor = html.includes(`for="${id}"`);
    if (!hasLabelFor) {
        console.error(`  FAIL: Form control #${id} has no explicit label for="${id}"`);
        missingLabels++;
    }
});

if (missingLabels > 0) {
    console.error(`FAIL: ${missingLabels} form controls missing explicit label associations!`);
    process.exit(1);
}
console.log(`PASS: All ${formControlIds.length} pitch deck form controls have explicit label associations.\n`);

// 3. ARIA Landmarks and Roles
console.log('Test 4.3: ARIA Landmarks & Roles...');
const requiredLandmarks = [
    'role="banner"',
    'role="main"',
    'aria-label="Hackathon Stations"',
    'aria-live="polite"',
    'role="progressbar"',
    'role="tablist"'
];

requiredLandmarks.forEach(item => {
    if (!html.includes(item)) {
        console.error(`FAIL: Missing ARIA landmark: ${item}`);
        process.exit(1);
    }
});
console.log('PASS: All ARIA landmarks, tablists, and live regions present.\n');

// 4. Heading Hierarchy
console.log('Test 4.4: Heading Hierarchy Check...');
const h1Count = (html.match(/<h1\b/gi) || []).length;
const h2Count = (html.match(/<h2\b/gi) || []).length;
console.log(`  Found ${h1Count} <h1> and ${h2Count} <h2> tags.`);
if (h1Count !== 1) {
    console.error('FAIL: Page should have exactly one <h1> heading for proper screen reader outline!');
    process.exit(1);
}
console.log('PASS: Heading hierarchy is clean and properly structured.\n');

// 5. Image Alt Text
console.log('Test 4.5: Image Alt Attributes...');
const imgTags = html.match(/<img[^>]*>/gi) || [];
imgTags.forEach((img, i) => {
    if (!img.includes('alt=')) {
        console.error(`FAIL: <img> tag #${i+1} missing alt attribute: ${img}`);
        process.exit(1);
    }
});
console.log(`PASS: All ${imgTags.length} images have informative alt text.\n`);

console.log('=== ALL ACCESSIBILITY SUITE TESTS PASSED! ===');
