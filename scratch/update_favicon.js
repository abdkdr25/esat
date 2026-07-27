const fs = require('fs');
const path = require('path');
const dir = './public';
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html')) {
        const p = path.join(dir, file);
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/<link rel="icon" type="image\/svg\+xml" href="video\/favicon-round\.svg">/g, '<link rel="icon" href="video/logo-yeni.png">');
        c = c.replace(/<link rel="apple-touch-icon" href="video\/favicon-round\.svg">/g, '<link rel="apple-touch-icon" href="video/logo-yeni.png">');
        fs.writeFileSync(p, c, 'utf8');
    }
});
console.log('Favicon güncellendi.');
