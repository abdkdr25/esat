const fs = require('fs');
const path = require('path');
const dirs = ['c:/Users/Kadir/OneDrive/Desktop/esat kılınç/public', 'c:/Users/Kadir/OneDrive/Desktop/esat kılınç/views'];

const replacements = {
    'K\ufffdl\ufffdn\ufffd': 'Kılınç',
    'K\ufffd\ufffdesi': 'Köşesi',
    'sa\ufffdl\ufffd\ufffd\ufffdna': 'sağlığına',
    'g\ufffdr\ufffd\ufffdleri': 'görüşleri',
    'i\ufffderikler': 'içerikler',
    'Y\ufffdkleniyor': 'Yükleniyor',
    'Y\ufffdklenemedi': 'Yüklenemedi',
    'L\ufffdtfen sayfay\ufffd yenileyin': 'Lütfen sayfayı yenileyin',
    'Hen\ufffdz Makale Yok': 'Henüz Makale Yok',
    'yak\ufffdnda ilk makalesini yay\ufffdnlayacak': 'yakında ilk makalesini yayınlayacak',
    'Devam\ufffdn\ufffd Oku': 'Devamını Oku',
    'H\ufffdzl\ufffd Ba\ufffdlant\ufffdlar': 'Hızlı Bağlantılar',
    'Hakk\ufffdm\ufffdzda': 'Hakkımızda',
    '\ufffdleti\ufffdim': 'İletişim',
    'Hafta i\ufffdi': 'Hafta içi',
    'T\ufffdm haklar\ufffd sakl\ufffdd\ufffdr': 'Tüm hakları saklıdır',
    '\ufffdleti\ufffdime Ge\ufffdin': 'İletişime Geçin',
    'A\ufffd\ufffdz ve di\ufffd': 'Ağız ve diş',
    'Di\ufffd Klini\ufffdi': 'Diş Kliniği',
    'g\ufffdr\ufffdt\ufffdl\ufffdt\ufffd': 'görüntülendi', // just in case
    'K\ufffdl\ufffdn\ufffd\'\ufffdn': 'Kılınç\'ın'
};

dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        if (f.endsWith('.html') || f.endsWith('.js')) {
            const p = path.join(d, f);
            let c = fs.readFileSync(p, 'utf8');
            let orig = c;
            
            for (const [bad, good] of Object.entries(replacements)) {
                // We use global replace
                c = c.split(bad).join(good);
            }
            
            // Some extra common ones with single \ufffd
            c = c.replace(/Di\ufffd/g, 'Diş');
            c = c.replace(/Klini\ufffdi/g, 'Kliniği');
            c = c.replace(/K\ufffdl\ufffdn\ufffd/g, 'Kılınç');
            c = c.replace(/K\ufffd\ufffdesi/g, 'Köşesi');
            c = c.replace(/A\ufffd\ufffdz/g, 'Ağız');

            if (c !== orig) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Fixed encoding in ' + f);
            }
        }
    });
});
