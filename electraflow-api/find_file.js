const XLSX = require('xlsx');
const fs = require('fs');

// Find the reference file
const dir = 'uploads';
const files = fs.readdirSync(dir).filter(f => f.toLowerCase().includes('sinapi') && f.toLowerCase().includes('refer'));
console.log('Files:', files);

// Try to find the file - may have been uploaded to a different location
// Let's just read a sample of the CSD sheet to see its real structure
const possiblePaths = [
    'uploads',
    'C:/Users/Euller Matheus/Downloads',
    'C:/Users/Euller Matheus/Desktop',
];

for (const p of possiblePaths) {
    try {
        const f = fs.readdirSync(p).filter(f => f.toLowerCase().includes('sinapi') && f.toLowerCase().includes('refer'));
        if (f.length > 0) console.log(`Found in ${p}:`, f);
    } catch(e) {}
}
