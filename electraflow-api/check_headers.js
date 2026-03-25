const { Client } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Check if any uploaded files are in uploads dir
const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log('Upload files:', files);
} else {
    console.log('No uploads dir');
}

// Parse test: try to read one of the SINAPI files if they exist
// The files might be in /tmp or uploads
const possibleDirs = [uploadsDir, '/tmp', path.join(__dirname, '..', 'uploads')];
for (const dir of possibleDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.includes('SINAPI') || f.includes('sinapi'));
    if (files.length > 0) {
        console.log('\nFound SINAPI files in', dir, ':', files);
        // Read first file
        const wb = XLSX.readFile(path.join(dir, files[0]));
        for (const sn of wb.SheetNames) {
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '', raw: false });
            console.log(`\nSheet "${sn}": ${rows.length} rows`);
            if (rows.length > 0) {
                console.log('Columns:', Object.keys(rows[0]));
                console.log('First row:', JSON.stringify(rows[0]).substring(0, 500));
                if (rows.length > 1) console.log('Second row:', JSON.stringify(rows[1]).substring(0, 500));
            }
        }
        break;
    }
}

console.log('\nDone');
