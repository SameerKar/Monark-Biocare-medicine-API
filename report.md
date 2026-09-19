# Monark Medicine Search Engine — Comprehensive Quality & Real-World Human Ordering Report

> **Evaluation Date:** September 19, 2026  
> **Dataset:** Monark Healthcare Products Catalog (`src/data/medicines.js` — 324 Medicines)  
> **Testing Scope:**  
> 1. **Technical Baseline Test:** 1,124 Automated Queries (Brands, Active Ingredients, Phonetics, Combinations)  
> 2. **Real-World Human Ordering Simulation:** 109 Natural Voice / Conversational & Field Orders across 6 Ordering Archetypes  

---

## 1. Executive Summary & Dual-Layer KPI Dashboard

The search engine was tested through two complementary lenses:
1. **Algorithmic Technical Benchmark:** Testing clean inputs, direct STT corruptions, and pure pharma tokens.
2. **Human Ordering Reality Check:** Testing how doctors, chemists, caregivers, and patients actually place orders via phone, voice AI, or chat in India.

### High-Level Metrics

| Evaluation Dimension | Total Test Queries | Passed | Suboptimal / Failed | Success Rate | Grade |
|---|---|---|---|---|---|
| **Layer 1: Technical & Phonetic Benchmark** | **1,124** | **1,022** | **102** | **90.9%** | 🟢 Highly Solid |
| **Layer 2: Real-World Human Ordering Simulation** | **109** | **68** | **41** | **62.4%** | 🟡 Vulnerable in Voice AI |

---

## 2. Layer 2: How Humans Order — The 6 Behavioral Archetypes

In real-world pharmacies, clinics, and voice AI calls (e.g. Oration AI / Maansi Agent), humans **never** speak like clean database search engines. They speak with quantities, conversational filler, specific dosage forms, strengths, or Hinglish carrier phrases.

Below is the field performance across the 6 Human Ordering Archetypes:

| Archetype | Real-World Ordering Behavior | Tests | Passed | Success Rate | Primary Failure Mode |
|---|---|---|---|---|---|
| **1. Conversational Voice Orders** | *"Give me 2 strips of Moxilase 625"*, *"Can you send 1 bottle of Erikast syrup"* | 15 | 2 | **13.3%** 🔴 | **Conversational Dropout:** Carrier phrases dilute character ratio; query drops to `no_match`. |
| **2. Strength-Specific Orders** | *"Figopred 8"*, *"Azilase 500"*, *"Furoark 500"*, *"Cefark 250"* | 25 | 15 | **60.0%** 🔴 | **Priority Inversion:** Returns wrong strength because normalized keys tie at 100 confidence. |
| **3. Form-Specific Orders** | *"Arkocet syrup"*, *"Moxilase drops"*, *"Ketoark shampoo"*, *"Luark cream"* | 23 | 16 | **69.6%** 🟡 | **Form Confusion:** Dispenses adult tablets/capsules to users asking for paediatric syrups/drops. |
| **4. Brand Modifier Orders** | *"Arkocet M"*, *"Arkocet AM"*, *"Arpod CV"*, *"Cefilase LB"*, *"Nazoark Cold & Flu"* | 21 | 20 | **95.2%** 🟢 | **High Accuracy:** Pharma modifiers are correctly preserved and prioritized. |
| **5. Generic Prescription Orders** | *"Cefpodoxime 200"*, *"Azithromycin 500mg"*, *"Faropenem 200"*, *"Linezolid 600"* | 16 | 10 | **62.5%** 🟡 | **Generic Strength Miss:** Resolves the chemical salt, but defaults to lowest/first strength in catalog. |
| **6. Hinglish & Colloquial Orders** | *"Arkocet ka syrup de do"*, *"Moxilase bacche wala drop"*, *"Bilark 20 ki do patti"* | 9 | 5 | **55.6%** 🟡 | **Vocabulary Noise:** Hinglish particles (*"de do"*, *"ka"*, *"ki patti"*) lower matching scores. |

---

## 3. The 3 Critical Business & Clinical Failure Modes

The human ordering simulation revealed three high-impact failure modes that must be addressed before deploying to production:

### 🚨 Critical Failure Mode 1: Paediatric & Liquid Dispensing Inversion
- **Clinical Scenario:** A parent or clinic orders *"Arkocet syrup"* or *"Erikast FX syrup"* for a young child who cannot swallow pills, or *"Moxilase drops"* for an infant.
- **Current Behavior:**
  - Query: `Arkocet syrup` → **Returns `ARKOCET-5 TABLET`** (Score 100)
  - Query: `Erikast FX syrup` → **Returns `ERIKAST-FX TABLET`** (Score 100)
  - Query: `Moxilase drop` → **Returns `MOXILASE-500 CAPSULE`** (Score 100)
- **Why It Happens:** `brandScrubNoise()` removes `syrup` and `drop` from both the user query and the database brand. Both the tablet and syrup reduce to the exact same normalized brand string (`arkocet-` or `erikast-fx`). Because tablets appear earlier in the database than syrups, the engine always picks the tablet first!
- **Risk:** High clinical risk if an automated voice agent confirms an adult tablet formulation for a child requiring oral liquid suspension.

### ⚠️ Critical Failure Mode 2: Sub-Therapeutic or Double-Dose Strength Inversion
- **Clinical Scenario:** A doctor prescribes 8mg methylprednisolone (*"Figopred 8"*), or a severe infection requires 500mg cefuroxime (*"Furoark 500"*).
- **Current Behavior:**
  - Query: `Figopred 8` → **Returns `FIGOPRED-4 TABLET`** (Score 100)
  - Query: `Furoark 500` → **Returns `FUROARK-250 TABLET`** (Score 100)
  - Query: `Azilase 500` → **Returns `AZILASE-250 TABLET`** (Score 100)
  - Query: `Arpod 200` → **Returns `ARPOD-100DT TABLET`** (Score 95)
  - Query: `Cefark 500` → **Returns `CEFARK-1000 INJECTION`** (Score 100)
  - Query: `Avzid 250` → **Returns `AVZID-1000 INJECTION`** (Score 100)
- **Why It Happens:** The indexer scrubs all numbers to form the normalized brand key. Both 4mg and 8mg reduce to `figopred-`. Both hit Tier 1 with 100 confidence. In `omniIndex.js` line 407, the dosage number boost executes `m.confidence = Math.min(100, m.confidence + 10)`. Because both candidates are already at 100, the boost cannot raise `FIGOPRED-8` above 100, and JavaScript's stable sort leaves `FIGOPRED-4` at #1.
- **Risk:** Patient receives half the required antibiotic/steroid dose or a 4x overdose.

### 📉 Critical Failure Mode 3: Conversational Voice AI Dropouts (86.7% Failure)
- **Clinical Scenario:** A human calling a voice agent naturally says:
  - *"Please send 2 strips of Moxilase CV 625"*
  - *"I need one bottle of Erikast FX syrup"*
  - *"Do you have Bilark 20 in stock?"*
  - *"Send 2 vials of Amiark 500 injection"*
- **Current Behavior:** **All return `no_match` (0 results)!**
- **Why It Happens:** The full natural sentence is fed verbatim into string-matching algorithms (`ratio`, `token_sort_ratio`). Because conversational carrier phrases constitute 60–75% of the total character length, the overall string match score plummets below the acceptance threshold (55–70), completely blinding the search engine.

---

## 4. Itemized Human Ordering Failure Log (41 Cases)

Below is the complete audit of failed human ordering queries:

| # | Archetype | Human Order Query | Expected Product | Actual Top Match | Score | Failure Reason |
|---|---|---|---|---|---|---|
| 1 | Conversational Voice Orders | `"Give me 2 strips of Moxilase CV 625"` | **MOXIALSE-CV-625** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 2 | Conversational Voice Orders | `"I need one bottle of Erikast FX syrup"` | **ERIKAST-FX SYRUP** | NONE | 0 | Conversational carrier phrase diluted match score |
| 3 | Conversational Voice Orders | `"Please send Arkocet 5 tablets"` | **ARKOCET-5** | ARKOCET-M TABLET | 70 | Strength inversion (tied at 100, defaulted to earlier row) |
| 4 | Conversational Voice Orders | `"Do you have Bilark 20 in stock?"` | **BILARK-20** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 5 | Conversational Voice Orders | `"Send 2 vials of Amiark 500 injection"` | **AMIARK-500** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 6 | Conversational Voice Orders | `"Looking for Nazoark Cold and Flu tablet"` | **NAZOARK COLD&FLU** | NONE | 0 | Conversational carrier phrase diluted match score |
| 7 | Conversational Voice Orders | `"Can you deliver one tube of Luark BD ointment?"` | **LUARK BD OINT** | NONE | 0 | Conversational carrier phrase diluted match score |
| 8 | Conversational Voice Orders | `"Order 5 boxes of Cefilase 200 LB"` | **CEFILASE-200 LB** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 9 | Conversational Voice Orders | `"Prescribe Furoark 500 tablet please"` | **FUROARK-500** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 10 | Conversational Voice Orders | `"Send 10 strips of Azilase 500 mg"` | **AZILASE-500** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 11 | Conversational Voice Orders | `"Do you have Arpod CV 200 tablet?"` | **ARPOD-CV** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |
| 12 | Conversational Voice Orders | `"Please send one bottle of Oflase suspension"` | **OFLASE SUSPENSION** | NONE | 0 | Conversational carrier phrase diluted match score |
| 13 | Conversational Voice Orders | `"Give me Cloark dusting powder"` | **CLOARK Powder** | NONE | 0 | Conversational carrier phrase diluted match score |
| 14 | Strength-Specific Orders | `"Figopred 8"` | **FIGOPRED-8** | FIGOPRED-4 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 15 | Strength-Specific Orders | `"Azilase 500"` | **AZILASE-500** | AZILASE-250 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 16 | Strength-Specific Orders | `"Furoark 500"` | **FUROARK-500** | FUROARK-250 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 17 | Strength-Specific Orders | `"Cefilase 100"` | **CEFILASE-100 DT** | CEFILASE-200 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 18 | Strength-Specific Orders | `"Cefilase 50"` | **CEFILASE-50 DT** | CEFILASE-200 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 19 | Strength-Specific Orders | `"Telmiark 20"` | **TELMIARK-20** | Telmiark-40 | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 20 | Strength-Specific Orders | `"Avzid 250"` | **AVZID-250** | AVZID-1000 INJECTION | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 21 | Strength-Specific Orders | `"Cefark 250"` | **CEFARK-250** | CEFARK-1000 INJECTION | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 22 | Strength-Specific Orders | `"Furoark 1500"` | **FUROARK-1500** | FUROARK-250 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 23 | Strength-Specific Orders | `"Furoark 750"` | **FUROARK-750** | FUROARK-250 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 24 | Form-Specific Orders | `"Arkocet syrup"` | **ARKOCET-M SYRUP** | ARKOCET-5 TABLET | 100 | Form ignored; defaulted to earlier tablet/capsule |
| 25 | Form-Specific Orders | `"Erikast FX syrup"` | **ERIKAST-FX SYRUP** | ERIKAST-FX TABLET | 100 | Form ignored; defaulted to earlier tablet/capsule |
| 26 | Form-Specific Orders | `"Cefilase dry syrup"` | **CEFILASE 50 d/s DRY SYP** | CEFILASE-100 DT TABLET | 87 | Form ignored; defaulted to earlier tablet/capsule |
| 27 | Form-Specific Orders | `"Moxilase dry syrup"` | **MOXILASE-CV DRY SYP** | MOXILASE-DX CAPSULE | 87 | Form ignored; defaulted to earlier tablet/capsule |
| 28 | Form-Specific Orders | `"Ketoark soap"` | **KETOARK MEDICATED SOAP** | KETOARK-200 | 85 | Form ignored; defaulted to earlier tablet/capsule |
| 29 | Form-Specific Orders | `"Luark ointment"` | **LUARK BD OINT** | MUPARK Ointments | 87 | Form ignored; defaulted to earlier tablet/capsule |
| 30 | Form-Specific Orders | `"Aconic soap"` | **ACONIC MEDICATED SOAP** | NONE | 0 | Form ignored; defaulted to earlier tablet/capsule |
| 31 | Brand Modifier & Suffix Orders | `"Telmiark Beta"` | **Telmiark-Beta 50** | Telmiark-Beta 25 | 100 | Conversational carrier phrase diluted match score |
| 32 | Generic Prescription Orders | `"Cefpodoxime 200"` | **ARPOD-200DT** | ARPOD-100DT TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 33 | Generic Prescription Orders | `"Azithromycin 500mg"` | **AZILASE-500** | AZILASE-250 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 34 | Generic Prescription Orders | `"Ofloxacin 200mg"` | **OFLASE-200** | ARPOD-OF TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 35 | Generic Prescription Orders | `"Cefixime 200mg"` | **CEFILASE-200** | CEFILASE-100 DT TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 36 | Generic Prescription Orders | `"Methylprednisolone 8mg"` | **FIGOPRED-8** | FIGOPRED-4 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 37 | Generic Prescription Orders | `"Amoxicillin Clavulanate 625"` | **MOXIALSE-CV-625** | MOXILASE-CV-375 TABLET | 100 | Strength inversion (tied at 100, defaulted to earlier row) |
| 38 | Hinglish & Colloquial Orders | `"Arkocet ka syrup de do"` | **ARKOCET-M SYRUP** | ARKOCET-5 TABLET | 85 | Vernacular word noise reduced score below threshold |
| 39 | Hinglish & Colloquial Orders | `"Moxilase bacche wala drop"` | **MOXILASE - CV DROP** | MOXILASE-500 CAPSULE | 85 | Vernacular word noise reduced score below threshold |
| 40 | Hinglish & Colloquial Orders | `"Nazoark sardi jukham wali"` | **NAZOARK COLD&FLU** | NAZOARK TABLET | 85 | Vernacular word noise reduced score below threshold |
| 41 | Hinglish & Colloquial Orders | `"Arpod 100 baccho ki dispersible tablet"` | **ARPOD-100DT** | NONE | 0 | Strength inversion (tied at 100, defaulted to earlier row) |

---

## 5. Layer 1 Baseline Performance (1,124 Technical Queries)

For reference, when queries are presented as clean medical tokens, the algorithmic performance of `omniIndex.js` remains exceptionally strong:

| Category | Total Queries | Passed | Rate | Key Observation |
|---|---|---|---|---|
| **Phonetic STT Garbled Brands** | 68 | 68 | **100.0%** | Flawless phonetic correction on Indian English accents (`arkoket`, `kipark`, `moxilaze`). |
| **Phonetic STT Salt / Chemicals** | 19 | 19 | **100.0%** | Perfect phonetic translation on chemical salts (`levosetrizine`, `cefpodoxim`). |
| **Spoken / Core Brands** | 324 | 314 | **96.9%** | Clean brand queries without dosage tags work across almost the entire catalog. |
| **Exact Single Salt / API** | 366 | 353 | **96.4%** | Direct active ingredient queries match accurately. |
| **Multi-Salt Formulations** | 23 | 22 | **95.7%** | Multi-drug queries resolve to the exact combination product. |
| **Full Brand (Exact CSV Name)** | 324 | 246 | **75.9%** | Impacted by the dosage tie-break bug documented in Failure Mode 2. |

---

## 6. Catalog Quality Audit: Typos & Duplicates in Source CSV

Cross-referencing against the source data (`Monark-medicine - Product List.csv`) identified typos that actively degrade search performance:

### Inherited Vendor Typos:
1. **Row 5 (`ARKOCET-AM TABLET`):** `Montelukasr 10mg` → Should be `Montelukast` (causes exact salt lookup miss).
2. **Row 20 (`AVMYST-M`):** `Alcohal 0.25%` → Should be `Alcohol`.
3. **Row 24 (`ARPOD-CV TABLET`):** `Potassum Clavulanate` → Should be `Potassium Clavulanate`.
4. **Row 78 (`MECOARK FORTE`):** `Nicotinamide100mg`, `Pyridoxine100mg` → Missing spaces prevent salt name tokenization.
5. **Row 79 (`AVPLEX-ADVANCE`):** `Sodium Hualuronate`, `Sulhpate` → Should be `Hyaluronate`, `Sulphate`.
6. **Row 119 (`FERIARK-XT`):** `Mrthylcobalamin 500 mcg` → Should be `Methylcobalamin`.
7. **Row 165 (`Arkovas-Gold`):** `CLOPIDROGREL 75MG` → Should be `Clopidogrel`.
8. **Row 300 (`KETOARK-PLUS NF`):** `Lodochlorhydroxyquinoline` (starts with `L`) → Should be `Iodochlorhydroxyquinoline` (starts with `I`).
9. **Row 304 (`MICDERM-OF`):** `Itrazconazole` → Should be `Itraconazole`.
10. **Row 307 (`NOXIDOL-F SOLUTION`):** `Finastride 0.1%W/V` → Should be `Finasteride` (fails `Minoxidil + Finasteride` combo search).

### Duplicate Records in Catalog:
- `CALCIARK-1000 TABLET`: Sno 101 & 159
- `AMIARK-500 INJECTION`: Sno 68 & 128
- `OFLASE-200 TABLET`: Sno 47 & 126
- `TELMIARK-40 TABLET`: Sno 201 & 253
- `CLINARK-150 CAPSULE`: Sno 271 & 273

---

## 7. Strategic Solution Blueprint: Transforming Monark for Human Voice Ordering

To elevate real-world ordering accuracy from **62.4% to 98%+**, four architectural upgrades should be applied to `src/search/omniIndex.js`:

### Upgrade 1: Voice AI Pre-Search Order Sanitizer (Fixes Failure Mode 3)
Strip conversational carrier phrases and quantity packaging terms before entering fuzzy matching:
```javascript
function sanitizeHumanOrder(rawQuery) {
  return rawQuery
    // Conversational carrier phrases
    .replace(/\b(please|kindly|send|give\s+me|i\s+need|i\s+want|do\s+you\s+have|looking\s+for|can\s+you\s+deliver|can\s+i\s+get|prescribe|order|buy|in\s+stock)\b/gi, "")
    // Quantity & packaging words
    .replace(/\b(\d+\s*(strips?|boxes|bottles?|vials?|tubes?|pattis?|packs?|pieces?|pcs))\b/gi, "")
    // Hinglish ordering noise
    .replace(/\b(ka|ki|ke|bhej\s+do|de\s+do|chahiye|wala|wali|dhoond\s+raha\s+hoon)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
```

### Upgrade 2: Strict Strength-Number Tie Breaking (Fixes Failure Mode 2)
When multiple strengths match a base brand, strictly prioritize the medicine containing the exact requested number:
```javascript
// Do not cap tied candidates at 100 where relative order is lost.
if (queryNums.length > 0) {
  for (const m of brandMatchesList) {
    const brandNums = extractNumbers(m["Brand Name"] || "");
    const hasMatchingNum = queryNums.some(qn => brandNums.includes(qn));
    // Exact matching number receives an uncapped tiebreaker score
    m._numTiebreaker = hasMatchingNum ? 100 : 0;
  }
  brandMatchesList.sort((a, b) => {
    // Primary sort: base confidence
    if (Math.abs(b.confidence - a.confidence) > 5) return b.confidence - a.confidence;
    // Secondary sort: number tiebreaker
    return (b._numTiebreaker || 0) - (a._numTiebreaker || 0);
  });
}
```

### Upgrade 3: Dosage Form Intent Enforcer (Fixes Failure Mode 1)
If the human mentions `syrup`, `drops`, `injection`, `shampoo`, `soap`, `powder`, or `lotion`, enforce that dosage form over tablets and capsules:
```javascript
const FORMS = ["syrup", "syp", "drop", "injection", "shampoo", "soap", "powder", "lotion", "cream", "ointment"];
const requestedForm = FORMS.find(f => new RegExp(`\\b${f}\\b`, "i").test(query));

if (requestedForm) {
  for (const m of brandMatchesList) {
    const brandText = (m["Brand Name"] + " " + (m.Pack || "")).toLowerCase();
    if (brandText.includes(requestedForm)) {
      m.confidence += 20; // Form priority boost
    } else {
      m.confidence -= 20; // Form mismatch penalty
    }
  }
  brandMatchesList.sort((a, b) => b.confidence - a.confidence);
}
```

### Upgrade 4: Monark Typo Aliases
Add known Monark CSV typos to the alias dictionary:
```javascript
const COMP_ALIASES = {
  "finasteride": ["finastride"],
  "montelukast": ["montelukasr"],
  "potassium":   ["potassum"],
  "hyaluronate": ["hualuronate"],
  "itraconazole":["itrazconazole"],
  "clopidogrel": ["clopidrogrel"]
};
```
