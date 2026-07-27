const fs = require('fs');
const path = require('path');

const dirs = [
    'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/public',
    'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/views'
];

dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        if (f.endsWith('.html') || f.endsWith('.js')) {
            const p = path.join(d, f);
            let c = fs.readFileSync(p, 'utf8');
            let orig = c;
            
            c = c.replace(/video\/logo-yeni\.jpeg/gi, 'video/logo-yeni.png');
            c = c.replace(/video\/logo\.jpeg/gi, 'video/logo-yeni.png');
            c = c.replace(/video\/logo\.png/gi, 'video/logo-yeni.png');
            
            // Update icon types if they exist
            c = c.replace(/type="image\/jpeg"\s+href="video\/logo-yeni\.png/g, 'type="image/png" href="video/logo-yeni.png');
            c = c.replace(/href="video\/logo-yeni\.png"\s+type="image\/jpeg"/g, 'href="video/logo-yeni.png" type="image/png"');

            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Updated logo references in ' + f);
            }
        }
    });
});
