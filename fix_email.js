const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join(publicDir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace the email line
    let newContent = content.replace(/[ \t]*<li><i class="fa-solid fa-envelope"><\/i> info@esatkilinc\.com<\/li>[\r\n]*/g, '');
        
    if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log('Updated ' + f);
    }
});
