const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const axios = require('axios');
const FormData = require('form-data');

// BURAYI KENDİ BİLGİLERİNİZLE DOLDURUN
const TELEGRAM_BOT_TOKEN = '8759750257:AAGtcP3tBULUB_VG1ML8CsxZU58auOdOUpM';
const CHAT_ID = '942281650';

const sourceDir = path.join(__dirname, '../'); // Proje ana dizini
const backupFile = path.join(__dirname, 'esat_klinik_yedek.zip');

async function backup() {
    console.log('Dosyalar sıkıştırılıyor...');
    try {
        const zip = new AdmZip();
        // Sadece public, utils, views gibi klasörleri ve html/js/env dosyalarını yedekle
        // node_modules ve .git hariç tutuluyor
        
        fs.readdirSync(sourceDir).forEach(file => {
            if (file === 'node_modules' || file === '.git' || file === 'scratch' || file === '.env') return;
            const fullPath = path.join(sourceDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                zip.addLocalFolder(fullPath, file);
            } else {
                zip.addLocalFile(fullPath);
            }
        });
        
        zip.writeZip(backupFile);
        console.log('Sıkıştırma tamamlandı. Telegrama gönderiliyor...');
        
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('document', fs.createReadStream(backupFile));
        form.append('caption', `Yedekleme Tarihi: ${new Date().toLocaleString('tr-TR')}`);

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, form, {
            headers: form.getHeaders()
        });
        
        console.log('Başarıyla Telegrama gönderildi!');
        fs.unlinkSync(backupFile); // Gönderdikten sonra zip dosyasını siler
    } catch (err) {
        console.error('Hata oluştu:', err.message);
    }
}
module.exports = { backup };
