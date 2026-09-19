import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchMedicine } from './src/search/omniIndex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running Real-World Human Ordering Simulation Suite...');

const testCases = [
  // =========================================================================
  // ARCHETYPE 1: CONVERSATIONAL & SENTENCE-BASED VOICE ORDERS
  // =========================================================================
  { archetype: 'Conversational Voice Orders', q: 'Give me 2 strips of Moxilase CV 625', targetBrand: 'MOXIALSE-CV-625', type: 'Sentence + Quantity' },
  { archetype: 'Conversational Voice Orders', q: 'I need one bottle of Erikast FX syrup', targetBrand: 'ERIKAST-FX SYRUP', type: 'Sentence + Container' },
  { archetype: 'Conversational Voice Orders', q: 'Please send Arkocet 5 tablets', targetBrand: 'ARKOCET-5', type: 'Sentence + Dosage' },
  { archetype: 'Conversational Voice Orders', q: 'Do you have Bilark 20 in stock?', targetBrand: 'BILARK-20', type: 'Inquiry' },
  { archetype: 'Conversational Voice Orders', q: 'Send 2 vials of Amiark 500 injection', targetBrand: 'AMIARK-500', type: 'Hospital Supply Order' },
  { archetype: 'Conversational Voice Orders', q: 'Looking for Nazoark Cold and Flu tablet', targetBrand: 'NAZOARK COLD&FLU', type: 'Sentence + Suffix' },
  { archetype: 'Conversational Voice Orders', q: 'Can you deliver one tube of Luark BD ointment?', targetBrand: 'LUARK BD OINT', type: 'Pharmacy Delivery Request' },
  { archetype: 'Conversational Voice Orders', q: 'Order 5 boxes of Cefilase 200 LB', targetBrand: 'CEFILASE-200 LB', type: 'Wholesale / Bulk Order' },
  { archetype: 'Conversational Voice Orders', q: 'I want to buy Ketoark shampoo 60ml', targetBrand: 'KETOARK SHAMPOO', type: 'Retail Consumer Order' },
  { archetype: 'Conversational Voice Orders', q: 'Prescribe Furoark 500 tablet please', targetBrand: 'FUROARK-500', type: 'Clinical Dictation' },
  { archetype: 'Conversational Voice Orders', q: 'Send 10 strips of Azilase 500 mg', targetBrand: 'AZILASE-500', type: 'Chemist Restock' },
  { archetype: 'Conversational Voice Orders', q: 'Do you have Arpod CV 200 tablet?', targetBrand: 'ARPOD-CV', type: 'Inquiry + Strength' },
  { archetype: 'Conversational Voice Orders', q: 'Please send one bottle of Oflase suspension', targetBrand: 'OFLASE SUSPENSION', type: 'Liquid Order' },
  { archetype: 'Conversational Voice Orders', q: 'Give me Cloark dusting powder', targetBrand: 'CLOARK Powder', type: 'Dermatology Retail' },
  { archetype: 'Conversational Voice Orders', q: 'I need Calmiark lotion 100ml', targetBrand: 'CALMIARK LOTION', type: 'Lotion Supply' },

  // =========================================================================
  // ARCHETYPE 2: STRENGTH-SPECIFIC ORDERS (Brand + Exact Number)
  // =========================================================================
  { archetype: 'Strength-Specific Orders', q: 'Figopred 8', targetBrand: 'FIGOPRED-8', type: 'Higher Strength' },
  { archetype: 'Strength-Specific Orders', q: 'Figopred 4', targetBrand: 'FIGOPRED-4', type: 'Lower Strength' },
  { archetype: 'Strength-Specific Orders', q: 'Azilase 500', targetBrand: 'AZILASE-500', type: 'Adult Antibiotic' },
  { archetype: 'Strength-Specific Orders', q: 'Azilase 250', targetBrand: 'AZILASE-250', type: 'Pediatric/Low Antibiotic' },
  { archetype: 'Strength-Specific Orders', q: 'Furoark 500', targetBrand: 'FUROARK-500', type: 'High Strength' },
  { archetype: 'Strength-Specific Orders', q: 'Furoark 250', targetBrand: 'FUROARK-250', type: 'Low Strength' },
  { archetype: 'Strength-Specific Orders', q: 'Arpod 200', targetBrand: 'ARPOD-200DT', type: 'High Dispersible' },
  { archetype: 'Strength-Specific Orders', q: 'Arpod 100', targetBrand: 'ARPOD-100DT', type: 'Mid Dispersible' },
  { archetype: 'Strength-Specific Orders', q: 'Arpod 50', targetBrand: 'ARPOD-50DT', type: 'Low Dispersible' },
  { archetype: 'Strength-Specific Orders', q: 'Cefilase 200', targetBrand: 'CEFILASE-200', type: 'Standard Tablet' },
  { archetype: 'Strength-Specific Orders', q: 'Cefilase 100', targetBrand: 'CEFILASE-100 DT', type: 'Paediatric DT' },
  { archetype: 'Strength-Specific Orders', q: 'Cefilase 50', targetBrand: 'CEFILASE-50 DT', type: 'Infant DT' },
  { archetype: 'Strength-Specific Orders', q: 'Arkocet 5', targetBrand: 'ARKOCET-5', type: 'Allergy Tablet' },
  { archetype: 'Strength-Specific Orders', q: 'Bilark 20', targetBrand: 'BILARK-20', type: 'Antihistamine 20mg' },
  { archetype: 'Strength-Specific Orders', q: 'Cipark 500', targetBrand: 'CIPARK-500', type: 'Fluoroquinolone 500mg' },
  { archetype: 'Strength-Specific Orders', q: 'Levolase 500', targetBrand: 'LEVOLASE-500', type: 'Levofloxacin 500mg' },
  { archetype: 'Strength-Specific Orders', q: 'Oflase 200', targetBrand: 'OFLASE-200', type: 'Ofloxacin 200mg' },
  { archetype: 'Strength-Specific Orders', q: 'Telmiark 40', targetBrand: 'Telmiark-40', type: 'Hypertension 40mg' },
  { archetype: 'Strength-Specific Orders', q: 'Telmiark 20', targetBrand: 'TELMIARK-20', type: 'Hypertension 20mg' },
  { archetype: 'Strength-Specific Orders', q: 'Avzid 1000', targetBrand: 'AVZID-1000', type: 'Ceftazidime 1g' },
  { archetype: 'Strength-Specific Orders', q: 'Avzid 250', targetBrand: 'AVZID-250', type: 'Ceftazidime 250mg' },
  { archetype: 'Strength-Specific Orders', q: 'Cefark 1000', targetBrand: 'CEFARK-1000', type: 'Ceftriaxone 1g' },
  { archetype: 'Strength-Specific Orders', q: 'Cefark 250', targetBrand: 'CEFARK-250', type: 'Ceftriaxone 250mg' },
  { archetype: 'Strength-Specific Orders', q: 'Furoark 1500', targetBrand: 'FUROARK-1500', type: 'Cefuroxime 1.5g Injection' },
  { archetype: 'Strength-Specific Orders', q: 'Furoark 750', targetBrand: 'FUROARK-750', type: 'Cefuroxime 750mg Injection' },

  // =========================================================================
  // ARCHETYPE 3: FORM-SPECIFIC ORDERS (Syrups, Drops, Injections, Ointments)
  // =========================================================================
  { archetype: 'Form-Specific Orders', q: 'Arkocet syrup', targetBrand: 'ARKOCET-M SYRUP', type: 'Syrup vs Tablet' },
  { archetype: 'Form-Specific Orders', q: 'Erikast FX syrup', targetBrand: 'ERIKAST-FX SYRUP', type: 'Suspension vs Tablet' },
  { archetype: 'Form-Specific Orders', q: 'Moxilase drops', targetBrand: 'MOXILASE - CV DROP', type: 'Drops vs Capsule' },
  { archetype: 'Form-Specific Orders', q: 'Arpod dry syrup', targetBrand: 'ARPOD DRY SYP', type: 'Dry Syrup vs Tablet' },
  { archetype: 'Form-Specific Orders', q: 'Cefilase dry syrup', targetBrand: 'CEFILASE 50 d/s DRY SYP', type: 'Dry Syrup vs Tablet' },
  { archetype: 'Form-Specific Orders', q: 'Moxilase dry syrup', targetBrand: 'MOXILASE-CV DRY SYP', type: 'Dry Syrup vs Capsule' },
  { archetype: 'Form-Specific Orders', q: 'Azilase suspension', targetBrand: 'AZILASE-100 SUSPENSION', type: 'Suspension vs Tablet' },
  { archetype: 'Form-Specific Orders', q: 'Fascort injection', targetBrand: 'FASCORT-40 INJECTION', type: 'Injection' },
  { archetype: 'Form-Specific Orders', q: 'Arkzone injection', targetBrand: 'ARKZONE-S 1000 INJECTION', type: 'Injection' },
  { archetype: 'Form-Specific Orders', q: 'Amiark injection', targetBrand: 'AMIARK-500 INJECTION', type: 'Injection' },
  { archetype: 'Form-Specific Orders', q: 'Ketoark shampoo', targetBrand: 'KETOARK SHAMPOO', type: 'Shampoo vs Soap/Lotion' },
  { archetype: 'Form-Specific Orders', q: 'Ketoark soap', targetBrand: 'KETOARK MEDICATED SOAP', type: 'Soap vs Shampoo/Lotion' },
  { archetype: 'Form-Specific Orders', q: 'Ketoark lotion', targetBrand: 'KETOARK LOTION', type: 'Lotion vs Shampoo/Soap' },
  { archetype: 'Form-Specific Orders', q: 'Ketoark powder', targetBrand: 'KETOARK Powder', type: 'Dusting Powder' },
  { archetype: 'Form-Specific Orders', q: 'Luark soap', targetBrand: 'LUARK SOAP', type: 'Antifungal Soap' },
  { archetype: 'Form-Specific Orders', q: 'Luark cream', targetBrand: 'LUARK', type: 'Antifungal Cream' },
  { archetype: 'Form-Specific Orders', q: 'Luark ointment', targetBrand: 'LUARK BD OINT', type: 'Ointment' },
  { archetype: 'Form-Specific Orders', q: 'Cloark powder', targetBrand: 'CLOARK Powder', type: 'Dusting Powder' },
  { archetype: 'Form-Specific Orders', q: 'Itoark powder', targetBrand: 'ITOARK Powder', type: 'Itraconazole Powder' },
  { archetype: 'Form-Specific Orders', q: 'Avmyst spray', targetBrand: 'AVMYST-M', type: 'Nasal Spray' },
  { archetype: 'Form-Specific Orders', q: 'Aconic face wash', targetBrand: 'ACONIC FACE WASH', type: 'Dermatological Wash' },
  { archetype: 'Form-Specific Orders', q: 'Aconic soap', targetBrand: 'ACONIC MEDICATED SOAP', type: 'Soap' },
  { archetype: 'Form-Specific Orders', q: 'Doxiark capsule', targetBrand: 'DOXIARK-LB CAPSULE', type: 'Capsule vs Tablet' },

  // =========================================================================
  // ARCHETYPE 4: BRAND MODIFIER & SUFFIX SPECIFIC ORDERS
  // =========================================================================
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Arkocet M', targetBrand: 'ARKOCET-M TABLET', type: 'Montelukast Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Arkocet AM', targetBrand: 'ARKOCET-AM TABLET', type: 'Ambroxol+Montelukast Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Arkocet A', targetBrand: 'ARKOCET-A TABLET', type: 'Ambroxol Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Arkocet Kid', targetBrand: 'ARKOCET-M-KID TABLET', type: 'Pediatric Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Arpod CV', targetBrand: 'ARPOD-CV TABLET', type: 'Clavulanate Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Arpod OF', targetBrand: 'ARPOD-OF TABLET', type: 'Ofloxacin Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Cefilase LB', targetBrand: 'CEFILASE-200 LB TABLET', type: 'Lactic Bacillus Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Cefilase CV', targetBrand: 'CEFILASE-CV TABLET', type: 'Clavulanate Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Cefilase OF', targetBrand: 'CEFILASE-OF TABLET', type: 'Ofloxacin Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Cefilase SB', targetBrand: 'CEFILASE-SB TABLET', type: 'Sulbactam Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Cipark TZ', targetBrand: 'CIPARK-TZ TABLET', type: 'Tinidazole Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Moxilase CV 625', targetBrand: 'MOXIALSE-CV-625 TABLET', type: 'Amoxicillin Clavulanate' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Moxilase LB 625', targetBrand: 'MOXILASE-LB-625 TABLET', type: 'Amox Clav LB' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Moxilase DX', targetBrand: 'MOXILASE-DX CAPSULE', type: 'Amox Clox LB' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Nazoark Plus', targetBrand: 'NAZOARK-PLUS TABLET', type: 'Plus Formulation' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Nazoark Cold and Flu', targetBrand: 'NAZOARK COLD&FLU TABLET', type: 'Cold&Flu Formulation' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Calciark XT', targetBrand: 'Calciark-XT', type: 'XT Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Calciark K27', targetBrand: 'CALCIARK K27 SOFTGEL CAPSULE', type: 'K2-7 Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Calciark D3', targetBrand: 'CALCIARK-D3 SOFTGEL CAPSULE', type: 'D3 Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Telmiark Beta', targetBrand: 'Telmiark-Beta 50', type: 'Beta-Blocker Suffix' },
  { archetype: 'Brand Modifier & Suffix Orders', q: 'Telmiark Trio', targetBrand: 'Telmiark-Trio', type: 'Triple Drug Suffix' },

  // =========================================================================
  // ARCHETYPE 5: GENERIC PRESCRIPTION ORDERS (Active Salt + Strength)
  // =========================================================================
  { archetype: 'Generic Prescription Orders', q: 'Cefpodoxime 200', targetBrand: 'ARPOD-200DT', type: 'API + Strength' },
  { archetype: 'Generic Prescription Orders', q: 'Cefpodoxime 100', targetBrand: 'ARPOD-100DT', type: 'API + Strength' },
  { archetype: 'Generic Prescription Orders', q: 'Azithromycin 500mg', targetBrand: 'AZILASE-500', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Azithromycin 250mg', targetBrand: 'AZILASE-250', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Faropenem 200mg', targetBrand: 'AVINEM-200', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Linezolid 600mg', targetBrand: 'AVZOLID-600', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Ciprofloxacin 500mg', targetBrand: 'CIPARK-500', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Levofloxacin 500mg', targetBrand: 'LEVOLASE-500', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Ofloxacin 200mg', targetBrand: 'OFLASE-200', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Cefixime 200mg', targetBrand: 'CEFILASE-200', type: 'API + Strength + Unit' },
  { archetype: 'Generic Prescription Orders', q: 'Amikacin 500 injection', targetBrand: 'AMIARK-500', type: 'API + Strength + Form' },
  { archetype: 'Generic Prescription Orders', q: 'Levocetirizine 5mg', targetBrand: 'ARKOCET-5', type: 'API + Strength' },
  { archetype: 'Generic Prescription Orders', q: 'Bilastine 20mg', targetBrand: 'BILARK-20', type: 'API + Strength' },
  { archetype: 'Generic Prescription Orders', q: 'Methylprednisolone 4mg', targetBrand: 'FIGOPRED-4', type: 'API + Strength' },
  { archetype: 'Generic Prescription Orders', q: 'Methylprednisolone 8mg', targetBrand: 'FIGOPRED-8', type: 'API + Strength' },
  { archetype: 'Generic Prescription Orders', q: 'Amoxicillin Clavulanate 625', targetBrand: 'MOXIALSE-CV-625', type: 'Combo API + Strength' },

  // =========================================================================
  // ARCHETYPE 6: HINGLISH & COLLOQUIAL INDIAN PHARMACY ORDERS
  // =========================================================================
  { archetype: 'Hinglish & Colloquial Orders', q: 'Arkocet ka syrup de do', targetBrand: 'ARKOCET-M SYRUP', type: 'Hinglish Liquid Order' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Moxilase bacche wala drop', targetBrand: 'MOXILASE - CV DROP', type: 'Hinglish Pediatric Drops' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Bilark 20 ki 2 patti', targetBrand: 'BILARK-20', type: 'Hinglish Strip Count' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Figopred 8 wali tablet chahiye', targetBrand: 'FIGOPRED-8', type: 'Hinglish Specific Strength' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Cefilase 200 ek box bhej do', targetBrand: 'CEFILASE-200', type: 'Hinglish Box Delivery' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Nazoark sardi jukham wali', targetBrand: 'NAZOARK COLD&FLU', type: 'Hinglish Indication Based' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Luark antifungal cream', targetBrand: 'LUARK', type: 'Category + Brand' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Ketoark dhoond raha hoon', targetBrand: 'KETOARK', type: 'Colloquial Seeking' },
  { archetype: 'Hinglish & Colloquial Orders', q: 'Arpod 100 baccho ki dispersible tablet', targetBrand: 'ARPOD-100DT', type: 'Hinglish DT Order' }
];

const results = [];
let passed = 0;

for (const t of testCases) {
  const res = searchMedicine(t.q);
  const matches = res.matches || [];
  const top = matches[0] || null;
  const topName = top ? top['Brand Name'] : 'NONE';
  const cleanTarget = t.targetBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTop = topName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Strict check: top match must contain target brand name or exact core identity
  const isMatch = top && (cleanTop.includes(cleanTarget) || cleanTarget.includes(cleanTop));

  if (isMatch) passed++;

  results.push({
    ...t,
    passed: isMatch,
    returnedStatus: res.status,
    topMatchBrand: topName,
    topScore: top ? top.confidence : 0,
    matchedVia: top ? top.matched_via : '-',
    totalMatches: matches.length
  });
}

console.log(`Executed ${testCases.length} Human Ordering simulation tests.`);
console.log(`Passed: ${passed} / ${testCases.length} (${((passed / testCases.length) * 100).toFixed(1)}%)`);

// Archetype breakdown
const archetypes = {};
results.forEach(r => {
  if (!archetypes[r.archetype]) archetypes[r.archetype] = { total: 0, passed: 0, cases: [] };
  archetypes[r.archetype].total++;
  if (r.passed) archetypes[r.archetype].passed++;
  archetypes[r.archetype].cases.push(r);
});

console.log('\nArchetype Breakdown:');
for (const a in archetypes) {
  const d = archetypes[a];
  console.log(` - ${a}: ${d.passed}/${d.total} (${((d.passed/d.total)*100).toFixed(1)}%)`);
}

fs.writeFileSync(path.join(__dirname, 'human_test_raw.json'), JSON.stringify({ results, archetypes }, null, 2), 'utf8');
console.log('Saved human test results to human_test_raw.json');
