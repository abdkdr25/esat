const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /Dr\. Muhammet Emin Başyıldız/g, to: 'Esat Kılınç Diş Kliniği' },
    { from: /Muhammet Emin Başyıldız/g, to: 'Esat Kılınç' },
    { from: /muhammeteminbasyildiz\.com/g, to: 'esatkilinc.com' },
    { from: /dt\.muhammetemin/g, to: 'dt.esatkilinc' },
    { from: /dr\.eminbasyildiz/g, to: 'esatkilinc.klinik' },
    { from: /\+90 535 064 56 84/g, to: '+90 555 123 45 67' },
    { from: /0535 064 56 84/g, to: '0555 123 45 67' },
    { from: /05350645684/g, to: '05551234567' },
    { from: /905350645684/g, to: '905551234567' },
    { from: /Pırlanta düğün salonu yanı, 60\. Yıl, Yavuz Sultan Selim Cd\. No:107A, 27100 Şahinbey\/Gaziantep/g, to: 'Merkez Mah. Atatürk Cad. No:1, Şişli/İstanbul' },
    { from: /60\. Yıl, Yavuz Sultan Selim Cd\. No:107A/g, to: 'Merkez Mah. Atatürk Cad. No:1' },
    { from: /Şahinbey/g, to: 'Şişli' },
    { from: /Gaziantep/g, to: 'İstanbul' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const r of replacements) {
                if (content.match(r.from)) {
                    content = content.replace(r.from, r.to);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'public'));
processDirectory(path.join(__dirname, 'views'));
processDirectory(path.join(__dirname, 'utils'));

console.log('Done.');
