const fs = require('fs');
const path = require('path');

const dirs = ['public', 'views'];
const swalScript = '    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>\n</head>';

// Add SweetAlert2 to all HTML files
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            if (file.endsWith('.html')) {
                let content = fs.readFileSync(path.join(dirPath, file), 'utf8');
                if (!content.includes('sweetalert2')) {
                    content = content.replace('</head>', swalScript);
                    fs.writeFileSync(path.join(dirPath, file), content, 'utf8');
                }
            }
        });
    }
});

// 1. Replace in public/script.js
let scriptJsPath = path.join(__dirname, 'public/script.js');
if (fs.existsSync(scriptJsPath)) {
    let scriptJs = fs.readFileSync(scriptJsPath, 'utf8');
    scriptJs = scriptJs.replace(/alert\(result\.error \|\| (['"`])(.*?)\1\);/g, "Swal.fire({title: 'Hata', text: result.error || $1$2$1, icon: 'error', confirmButtonText: 'Tamam', confirmButtonColor: '#ef4444'});");
    scriptJs = scriptJs.replace(/alert\((['"`])(.*?)\1\);/g, "Swal.fire({title: 'Bilgi', text: $1$2$1, icon: 'info', confirmButtonText: 'Tamam', confirmButtonColor: '#00b4d8'});");
    fs.writeFileSync(scriptJsPath, scriptJs, 'utf8');
}

// 2. Replace in views/panel.html
let panelHtmlPath = path.join(__dirname, 'views/panel.html');
if (fs.existsSync(panelHtmlPath)) {
    let panelHtml = fs.readFileSync(panelHtmlPath, 'utf8');
    
    panelHtml = panelHtml.replace(/alert\(result\.message \|\| (['"`])(.*?)\1\);/g, "Swal.fire({title: 'Bilgi', text: result.message || $1$2$1, icon: 'info', confirmButtonText: 'Tamam', confirmButtonColor: '#00b4d8'});");
    panelHtml = panelHtml.replace(/alert\((['"`])(.*?)\1\);/g, "Swal.fire({title: 'Bilgi', text: $1$2$1, icon: 'info', confirmButtonText: 'Tamam', confirmButtonColor: '#00b4d8'});");

    panelHtml = panelHtml.replace(/if \(!confirm\((['"`])(.*?)\1\)\) return;/g, `const { isConfirmed } = await Swal.fire({
                title: 'Emin misiniz?',
                text: $1$2$1,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Evet, Onaylıyorum',
                cancelButtonText: 'İptal'
            });
            if (!isConfirmed) return;`);

    // Handle the multiline confirm for personelSil
    panelHtml = panelHtml.replace(/if \(!confirm\((`TC: \$\{p\.username\}[^`]+`)\)\) \{\s*return;\s*\}/g, `const { isConfirmed } = await Swal.fire({
                title: 'Emin misiniz?',
                text: $1,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Evet, Sil',
                cancelButtonText: 'İptal'
            });
            if (!isConfirmed) return;`);

    fs.writeFileSync(panelHtmlPath, panelHtml, 'utf8');
}

console.log('SweetAlert2 entegrasyonu tamamlandı.');
