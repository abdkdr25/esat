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
            
            c = c.replace(/<link[^>]*rel=["']icon["'][^>]*href=["']video\/logo-yeni\.png(\?v=\d+)?["'][^>]*>/g, '<link rel="icon" type="image/svg+xml" href="video/favicon-round.svg">');
            c = c.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']video\/logo-yeni\.png(\?v=\d+)?["'][^>]*>/g, '<link rel="apple-touch-icon" href="video/favicon-round.svg">');

            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Updated favicon in ' + f);
            }
        }
    });
});
