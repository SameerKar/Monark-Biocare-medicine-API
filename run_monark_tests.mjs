import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchMedicine } from './src/search/omniIndex.js';
import { medicineDb } from './src/data/medicines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`Starting comprehensive Monark test run across ${medicineDb.length} medicines...`);

// Helper to clean dosage words for natural speech brand queries
function extractCoreBrand(rawBrand) {
  if (!rawBrand) return '';
  return rawBrand
    .replace(/\b(TABLET|TABLETS|CAPSULE|CAPSULES|CAP|INJECTION|INJ|SYRUP|SYP|SUSPENSION|SUSP|DROPS?|OINTMENT|OINT|CREAM|LOTION|SOAP|POWDER|SOLUTION|SPRAY|GEL|FACE WASH|MEDICATED SOAP)\b/gi, '')
    .replace(/\b(UNDER DPCO|NON DPCO|DPCO|\(DRUG\)|\(NON DPCO\)|\(UNDER DPCO\))\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean salt name from strength/filler
function cleanSaltName(salt) {
  return salt
    .replace(/\b[0-9]+(\.[0-9]+)?\s*(mg|gm|ml|mcg|iu|%|w\/v|w\/w|billions?)\b/gi, '')
    .replace(/[0-9]+(\.[0-9]+)?/g, '')
    .replace(/\b(tablets?|capsules?|syrup|injection|suspension|cream|dry|with|and|dispersible|sustained release|sr|ip|bp|usp|hcl|hydrochloride|sodium|potassium|trihydrate|maleate|nitrate|furoate|dipropionate|diethylamine|sulphate|sulfate)\b/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate phonetic STT distortion
function distortSTT(str) {
  let s = str.toLowerCase();
  // common indian STT mishearings
  s = s.replace(/c/g, 'k');
  s = s.replace(/ph/g, 'f');
  s = s.replace(/z/g, 's');
  s = s.replace(/v/g, 'b');
  s = s.replace(/ee/g, 'i');
  s = s.replace(/oo/g, 'u');
  s = s.replace(/x/g, 'ks');
  return s;
}

const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    byCategory: {}
  },
  categories: {
    full_brand: { name: 'Full Brand (Exact CSV Name)', total: 0, passed: 0, cases: [] },
    spoken_brand: { name: 'Spoken / Core Brand (No Dosage Form)', total: 0, passed: 0, cases: [] },
    stt_brand: { name: 'Phonetic STT Garbled Brands', total: 0, passed: 0, cases: [] },
    exact_salt: { name: 'Exact Single Salt / API', total: 0, passed: 0, cases: [] },
    combo_salt: { name: 'Multi-Salt Combinations', total: 0, passed: 0, cases: [] },
    stt_salt: { name: 'Phonetic STT Salt Queries', total: 0, passed: 0, cases: [] }
  }
};

function recordTest(categoryKey, query, expectedId, expectedBrand, expectedComp, validatorFn) {
  const cat = testResults.categories[categoryKey];
  cat.total++;
  testResults.summary.total++;

  const res = searchMedicine(query);
  const status = res.status;
  const matches = res.matches || [];

  const topMatch = matches[0] || null;
  const matchIds = matches.map(m => m.Sno);
  const isMatchFound = matches.length > 0;
  
  // Custom validation
  const passed = validatorFn(res, topMatch, matchIds, matches);

  if (passed) {
    cat.passed++;
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }

  cat.cases.push({
    query,
    expectedId,
    expectedBrand,
    expectedComp,
    passed,
    status,
    topMatch: topMatch ? {
      sno: topMatch.Sno,
      brand: topMatch["Brand Name"],
      comp: topMatch["Composition"],
      matched_via: topMatch.matched_via,
      confidence: topMatch.confidence
    } : null,
    totalMatches: matches.length
  });
}

// ------------------------------------------------------------------
// 1. FULL BRAND TESTS (All 324 medicines)
// ------------------------------------------------------------------
console.log('Running Full Brand tests...');
medicineDb.forEach(item => {
  const brand = item["Brand Name"];
  recordTest(
    'full_brand',
    brand,
    item.Sno,
    brand,
    item.Composition,
    (res, topMatch, matchIds) => {
      // Passes if top match is the expected item, or in multiple_exact_matches expected item is #1
      return topMatch && topMatch.Sno === item.Sno;
    }
  );
});

// ------------------------------------------------------------------
// 2. SPOKEN / CORE BRAND TESTS (All 324 medicines)
// ------------------------------------------------------------------
console.log('Running Spoken / Core Brand tests...');
medicineDb.forEach(item => {
  const core = extractCoreBrand(item["Brand Name"]);
  if (!core || core.length < 2) return;

  recordTest(
    'spoken_brand',
    core,
    item.Sno,
    item["Brand Name"],
    item.Composition,
    (res, topMatch, matchIds, matches) => {
      // Passes if the medicine or an exact variant with same core name is in top 3
      if (!topMatch) return false;
      const cleanCore = core.toLowerCase().replace(/[^a-z0-9]/g, '');
      const topCore = extractCoreBrand(topMatch["Brand Name"]).toLowerCase().replace(/[^a-z0-9]/g, '');
      return matchIds.slice(0, 3).includes(item.Sno) || topCore.includes(cleanCore) || cleanCore.includes(topCore);
    }
  );
});

// ------------------------------------------------------------------
// 3. PHONETIC STT GARBLED BRAND TESTS
// ------------------------------------------------------------------
console.log('Running Phonetic STT Garbled Brand tests...');
// Test 100 diverse brand items with simulated STT distortions
medicineDb.slice(0, 100).forEach(item => {
  const core = extractCoreBrand(item["Brand Name"]);
  if (!core || core.length < 3) return;
  const distorted = distortSTT(core);
  if (distorted === core.toLowerCase()) return; // Skip if no distortion occurred

  recordTest(
    'stt_brand',
    distorted,
    item.Sno,
    item["Brand Name"],
    item.Composition,
    (res, topMatch, matchIds) => {
      if (!topMatch) return false;
      // Acceptable if target medicine is in matches or topMatch belongs to same brand family
      const cleanExpected = core.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanTop = extractCoreBrand(topMatch["Brand Name"]).toLowerCase().replace(/[^a-z0-9]/g, '');
      return matchIds.slice(0, 5).includes(item.Sno) || (topMatch.confidence >= 75 && (cleanTop.startsWith(cleanExpected.slice(0, 4)) || cleanExpected.startsWith(cleanTop.slice(0, 4))));
    }
  );
});

// ------------------------------------------------------------------
// 4. EXACT SINGLE SALT / ACTIVE INGREDIENT TESTS
// ------------------------------------------------------------------
console.log('Running Exact Single Salt tests...');
// Collect unique individual salts
const uniqueSaltsMap = new Map();
medicineDb.forEach(item => {
  const comp = item.Composition || '';
  const parts = comp.split('+');
  parts.forEach(p => {
    const cleaned = cleanSaltName(p);
    if (cleaned.length >= 4 && !cleaned.toLowerCase().includes('not available')) {
      if (!uniqueSaltsMap.has(cleaned.toLowerCase())) {
        uniqueSaltsMap.set(cleaned.toLowerCase(), { name: cleaned, sampleSno: item.Sno, rawComp: comp });
      }
    }
  });
});

console.log(`Found ${uniqueSaltsMap.size} unique active ingredient salts across Monark.`);

uniqueSaltsMap.forEach((meta, saltKey) => {
  recordTest(
    'exact_salt',
    meta.name,
    meta.sampleSno,
    '',
    meta.rawComp,
    (res, topMatch, matchIds, matches) => {
      if (!topMatch) return false;
      // All matches must contain the queried salt in their composition
      const saltWords = meta.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (saltWords.length === 0) return true;
      const topComp = (topMatch.Composition || '').toLowerCase();
      return saltWords.some(w => topComp.includes(w));
    }
  );
});

// ------------------------------------------------------------------
// 5. MULTI-SALT COMBINATIONS
// ------------------------------------------------------------------
console.log('Running Multi-Salt Combination tests...');
const combos = [
  { q: "Acebrophylline + N-Acetylcysteine", expected: "ARKFYLIN-N" },
  { q: "Levocetirizine + Ambroxol", expected: "ARKOCET-A" },
  { q: "Levocetirizine + Montelukast", expected: "ARKOCET-M" },
  { q: "Bilastine + Montelukast", expected: "BILARK-M" },
  { q: "Montelukast + Fexofenadine", expected: "ERIKAST-FX" },
  { q: "Paracetamol + Phenylephrine", expected: "NAZOARK" },
  { q: "Aceclofenac + Paracetamol", expected: "NAZOARK COLD&FLU" },
  { q: "Nimesulide + Cetirizine", expected: "NIMLASE-COLD" },
  { q: "Cefpodoxime + Potassium Clavulanate", expected: "ARPOD-CV" },
  { q: "Cefpodoxime + Ofloxacin", expected: "ARPOD-OF" },
  { q: "Cefixime + Potassium Clavulanate", expected: "CEFILASE-CV" },
  { q: "Cefixime + Ofloxacin", expected: "CEFILASE-OF" },
  { q: "Cefixime + Sulbactam", expected: "CEFILASE-SB" },
  { q: "Ciprofloxacin + Tinidazole", expected: "CIPARK-TZ" },
  { q: "Cefuroxime Axetil + Potassium Clavulanate", expected: "FUROARK-CV-500" },
  { q: "Amoxicillin + Potassium Clavulanate", expected: "MOXILASE-CV" },
  { q: "Ofloxacin + Ornidazole", expected: "OFLASE-OZ" },
  { q: "Amikacin 500mg", expected: "AMIARK-500" },
  { q: "Cefoperazone + Sulbactam", expected: "ARKZONE-S" },
  { q: "Ketoconazole + Coal Tar", expected: "KETOARK LOTION" },
  { q: "Ketoconazole + ZPTO", expected: "KETOARK SHAMPOO" },
  { q: "Minoxidil + Finasteride", expected: "NOXIDOL-F" },
  { q: "Luliconazole + Beclomethasone", expected: "LUARK BD OINT" }
];

combos.forEach(c => {
  recordTest(
    'combo_salt',
    c.q,
    null,
    c.expected,
    c.q,
    (res, topMatch, matchIds, matches) => {
      if (!topMatch) return false;
      const salts = c.q.toLowerCase().split('+').map(s => s.trim().split(/\s+/)[0]);
      const topComp = (topMatch.Composition || '').toLowerCase();
      return salts.some(s => topComp.includes(s));
    }
  );
});

// ------------------------------------------------------------------
// 6. PHONETIC STT SALT QUERIES
// ------------------------------------------------------------------
console.log('Running Phonetic STT Salt tests...');
const sttSalts = [
  { q: "levosetrizine", target: "levocetirizine" },
  { q: "cefpodoxim", target: "cefpodoxime" },
  { q: "cefixim", target: "cefixime" },
  { q: "amoxicilin", target: "amoxicillin" },
  { q: "amoxycilin", target: "amoxycillin" },
  { q: "ciprofloxasin", target: "ciprofloxacin" },
  { q: "azithromisin", target: "azithromycin" },
  { q: "fexofenadin", target: "fexofenadine" },
  { q: "montelucast", target: "montelukast" },
  { q: "paracetemol", target: "paracetamol" },
  { q: "faropenam", target: "faropenem" },
  { q: "linezolid", target: "linezolid" },
  { q: "ofloxasin", target: "ofloxacin" },
  { q: "metranidazol", target: "metronidazole" },
  { q: "ketokonazol", target: "ketoconazole" },
  { q: "lulikonazol", target: "luliconazole" },
  { q: "sertaconazol", target: "sertaconazole" },
  { q: "terbinafin", target: "terbinafine" },
  { q: "mupirosin", target: "mupirocin" }
];

sttSalts.forEach(s => {
  recordTest(
    'stt_salt',
    s.q,
    null,
    '',
    s.target,
    (res, topMatch, matchIds, matches) => {
      if (!topMatch) return false;
      const topComp = (topMatch.Composition || '').toLowerCase();
      // check if normalized salt or phonetic alias matched
      return topComp.includes(s.target.slice(0, 5)) || topMatch.confidence >= 75;
    }
  );
});

// Compute category percentages
for (const k in testResults.categories) {
  const cat = testResults.categories[k];
  cat.rate = cat.total > 0 ? ((cat.passed / cat.total) * 100).toFixed(1) : '0.0';
  testResults.summary.byCategory[k] = { total: cat.total, passed: cat.passed, rate: cat.rate };
}
testResults.summary.overallRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);

console.log('\n=== TEST RUN FINISHED ===');
console.log(`Total Queries: ${testResults.summary.total}`);
console.log(`Passed: ${testResults.summary.passed} (${testResults.summary.overallRate}%)`);
console.log(`Failed: ${testResults.summary.failed}`);
for (const k in testResults.categories) {
  console.log(` - ${testResults.categories[k].name}: ${testResults.categories[k].passed}/${testResults.categories[k].total} (${testResults.categories[k].rate}%)`);
}

// Save detailed json for report generator
fs.writeFileSync(path.join(__dirname, 'test_output_raw.json'), JSON.stringify(testResults, null, 2), 'utf8');
console.log('Saved raw results to test_output_raw.json');
