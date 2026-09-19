const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, '../Monark-medicine - Product List.csv');
const outputPath = path.resolve(__dirname, 'src/data/medicines.js');

const raw = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines taking into account quotes
function parseCSV(text) {
  const lines = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(current.trim());
      current = '';
      if (row.some(f => f.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      current += c;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(f => f.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

const rows = parseCSV(raw);
const [header, ...dataRows] = rows;

console.log(`Parsed ${dataRows.length} rows. Header:`, header);

const medicineDb = dataRows.map((cols, idx) => {
  const name = cols[0] || '';
  const composition = cols[1] || '';
  const packing = cols[2] || '';

  return {
    "Sno": idx + 1,
    "Brand Name": name,
    "Composition": composition,
    "Pack": packing,
    "Packing": packing
  };
});

const fileContent = `export const medicineDb = ${JSON.stringify(medicineDb, null, 2)};\n`;

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log(`Successfully written ${medicineDb.length} medicines to ${outputPath}`);
