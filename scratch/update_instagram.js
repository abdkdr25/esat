const fs = require('fs');
const path = require('path');
const dirs = ['c:/Users/Kadir/OneDrive/Desktop/esat kılınç/public', 'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/views'];
dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        if (f.endsWith('.html') || f.endsWith('.js')) {
            const p = path.join(d, f);
            let c = fs.readFileSync(p, 'utf8');
            let orig = c;
            
            c = c.replace(/instagram\.com\/dt\.esatkilinc\/?/g, 'instagram.com/dt.esatkilic/');

            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Updated instagram link in ' + f);
            }
        }
    });
});
