const fs = require('fs');
const path = require('path');
const dirs = ['c:/Users/Kadir/OneDrive/Desktop/esat kılınç/public', 'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/views'];
dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        if (f.endsWith('.html')) {
            const p = path.join(d, f);
            let c = fs.readFileSync(p, 'utf8');
            let orig = c;
            
            c = c.replace(/\+90\s*555\s*123\s*45\s*67/g, '+90 536 653 97 95');
            c = c.replace(/\+905551234567/g, '+905366539795');

            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Updated +90 phone in ' + f);
            }
        }
    });
});
