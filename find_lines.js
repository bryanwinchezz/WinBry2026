const fs = require('fs');
const file = 'style.css';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log("=== LINHAS COM 'stats-grid' ===");
lines.forEach((line, index) => {
    if (line.includes('stats-grid') || line.includes('stat-card')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
