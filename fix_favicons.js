const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join(publicDir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace old favicons with logo-yeni.png
    let newContent = content
        .replace(/<link rel="icon" type="image\/x-icon" href="favicon\.ico">\s*/g, '')
        .replace(/<link rel="icon" type="image\/png" sizes="32x32" href="favicon\.png">/g, '<link rel="icon" href="video/logo-yeni.png">')
        .replace(/<link rel="apple-touch-icon" href="favicon\.png">/g, '<link rel="apple-touch-icon" href="video/logo-yeni.png">');
        
    if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log('Updated ' + f);
    }
});
