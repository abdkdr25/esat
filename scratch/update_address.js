const fs = require('fs');
const path = require('path');

const dirs = [
    'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/public',
    'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/utils'
];

dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(file => {
        if(file.endsWith('.html') || file.endsWith('.js')) {
            const p = path.join(d, file);
            let c = fs.readFileSync(p, 'utf8');
            let orig = c;
            
            // Replace the full address string with or without Şişli
            // Some files might have 'Atatrk' or 'ili/stanbul' because of encoding issues, we use a broader regex.
            c = c.replace(/Merkez Mah\.\s*Atat.*?rk Cad\.\s*No:1,?(?:\s*<br>\s*)?(?:\s*.*?i.*?li\/.*?stanbul)?/gi, '60.yıl mahallesi yavuz sultan selim caddesi No:121/b');
            
            // For JSON schema LD:
            c = c.replace(/"addressLocality":\s*"Şişli"/g, '"addressLocality": "Şahinbey"');
            c = c.replace(/"addressLocality":\s*"ili"/g, '"addressLocality": "Şahinbey"');
            c = c.replace(/"addressRegion":\s*"İstanbul"/g, '"addressRegion": "Gaziantep"');
            c = c.replace(/"addressRegion":\s*"stanbul"/g, '"addressRegion": "Gaziantep"');
            
            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Updated ' + file);
            }
        }
    });
});
