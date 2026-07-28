const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join(publicDir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace old favicons with logo-yeni.png
    let newContent = content
        .replace(/[ \t]*<a href="#" class="social-icon"><i class="fa-brands fa-facebook-f"><\/i><\/a>[\r\n]*/g, '')
        .replace(/[ \t]*<a href="#" class="social-icon"><i class="fa-brands fa-linkedin-in"><\/i><\/a>[\r\n]*/g, '');
        
    if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log('Updated ' + f);
    }
});
