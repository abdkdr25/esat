const fs = require('fs');
const path = require('path');
const dirs = ['c:/Users/Kadir/OneDrive/Desktop/esat kılınç/public', 'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/utils'];
dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        if (f.endsWith('.html') || f.endsWith('.js')) {
            const p = path.join(d, f);
            let c = fs.readFileSync(p, 'utf8');
            let orig = c;
            // Update the map query link
            c = c.replace(/query=[^\"\'\&\s]+/g, 'query=60.y%C4%B1l+mahallesi+yavuz+sultan+selim+caddesi+No%3A121%2Fb');
            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Updated maps link in ' + f);
            }
        }
    });
});
