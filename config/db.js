require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: process.env.DB_PORT || 3306,
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'randevu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDb() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ MySQL bağlantısı başarılı!');

        // Admins tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Default admin var mı?
        const [rows] = await pool.query("SELECT * FROM admins WHERE username = 'admin'");
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash("12345", 10);
            await pool.query("INSERT INTO admins (username, password) VALUES (?, ?)", ["admin", hashedPassword]);
            console.log("✅ Default admin kullanıcısı oluşturuldu: admin / 12345");
        }

         // Randevular tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS randevular (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ad VARCHAR(100) NOT NULL,
                telefon VARCHAR(15) NOT NULL,
                email VARCHAR(100),
                tarih DATE NOT NULL,
                saat VARCHAR(5) NOT NULL,
                notlar TEXT,
                durum ENUM('pending', 'approved', 'cancelled') DEFAULT 'pending',
                toplam_tutar DECIMAL(10, 2) DEFAULT 0.00,
                odenen_tutar DECIMAL(10, 2) DEFAULT 0.00,
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Kolonların sonradan eklenmesi durumu için ALTER TABLE (Garantiye almak amacıyla)
        try {
            await pool.query("ALTER TABLE randevular ADD COLUMN toplam_tutar DECIMAL(10, 2) DEFAULT 0.00");
        } catch (err) {}
        try {
            await pool.query("ALTER TABLE randevular ADD COLUMN odenen_tutar DECIMAL(10, 2) DEFAULT 0.00");
        } catch (err) {}

        // Eski sistemde kalan tüm UNIQUE kısıtlamalarını dinamik olarak bulup kaldırıyoruz.
        // Bu sayede aynı saate (biri iptal edilmişse) tekrar randevu kaydı (INSERT) atılabilir.
        try {
            const [indexes] = await pool.query("SHOW INDEX FROM randevular WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
            for (let idx of indexes) {
                await pool.query(`ALTER TABLE randevular DROP INDEX \`${idx.Key_name}\``);
                console.log(`✅ UNIQUE index kaldırıldı: ${idx.Key_name}`);
            }
        } catch (e) {
            console.log("Index temizleme işlemi atlandı veya hata oluştu:", e.message);
        }

        // Makaleler tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS makaleler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                baslik VARCHAR(255) NOT NULL,
                icerik TEXT NOT NULL,
                kapak_resmi VARCHAR(500),
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Galeri tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS galeri (
                id INT AUTO_INCREMENT PRIMARY KEY,
                eski_foto VARCHAR(500) NOT NULL,
                yeni_foto VARCHAR(500) NOT NULL,
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Yorumlar tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS yorumlar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                isim VARCHAR(100) NOT NULL,
                yorum TEXT NOT NULL,
                onaylandi_mi BOOLEAN DEFAULT FALSE,
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Doktorlar tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS doktorlar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                isim VARCHAR(100) NOT NULL,
                unvan VARCHAR(150) NOT NULL,
                fotograf VARCHAR(500) NOT NULL,
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // FAQ (SSS) tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS faq (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hasta_adi VARCHAR(100) NOT NULL,
                soru TEXT NOT NULL,
                cevap TEXT,
                durum ENUM('bekliyor', 'yayinda') DEFAULT 'bekliyor',
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if faq is empty and seed if necessary
        const [faqRows] = await pool.query('SELECT COUNT(*) as count FROM faq');
        if (faqRows[0].count === 0) {
            const initialFaq = [
                ["Sistem", "Ne sıklıkla diş muayenesine gelmeliyim?", "Genel ağız ve diş sağlığınızı korumak, olası sorunları erken teşhis etmek için herhangi bir şikayetiniz olmasa bile 6 ayda bir rutin diş hekimi kontrolüne gelmenizi tavsiye ediyoruz.", "yayinda"],
                ["Sistem", "Diş taşı temizliği (detertraj) dişlerime veya mineme zarar verir mi?", "Hayır, zarar vermez. Aksine, diş yüzeyinde biriken plak ve tartarın temizlenmemesi diş eti hastalıklarına, kemik erimesine ve diş kayıplarına yol açar. Diş taşı temizliği, dişin kendisinden değil yüzeyindeki zararlı eklentilerden arındırılması işlemidir.", "yayinda"],
                ["Sistem", "İmplant tedavisi ağrılı bir işlem midir?", "İmplant cerrahisi genellikle lokal anestezi altında gerçekleştirilir. Bu nedenle işlem sırasında hiçbir ağrı veya sızı hissetmezsiniz. İşlem sonrasında oluşabilecek hafif rahatsızlıklar ise hekiminizin reçete edeceği ağrı kesicilerle kolayca kontrol altına alınabilir.", "yayinda"],
                ["Sistem", "Diş fırçalarken diş etlerim kanıyor, ne yapmalıyım?", "Diş eti kanaması sağlıklı bir durum değildir ve genellikle diş eti iltihabının (gingivitis) ilk belirtisidir. Böyle bir durumda fırçalamayı bırakmamalı, yumuşak hareketlerle fırçalamaya devam etmeli ve en kısa sürede bir diş hekimine başvurmalısınız.", "yayinda"],
                ["Sistem", "Diş beyazlatma (bleaching) işlemi kalıcı mıdır?", "Diş beyazlatma işleminin etkisi kişinin ağız hijyenine ve beslenme alışkanlıklarına (çay, kahve, sigara tüketimi vb.) bağlı olarak değişir. Genellikle etkisi 1 ila 3 yıl arasında sürer. Gerekli görüldüğünde destekleyici seanslarla beyazlık korunabilir.", "yayinda"],
                ["Sistem", "Çocukların ilk diş hekimi muayenesi ne zaman yapılmalıdır?", "Bebeklerde ilk süt dişinin sürmesinden itibaren (genellikle 6 ay ile 1 yaş arası) ilk diş hekimi ziyareti yapılmalıdır. Bu ziyaret, bebeğinizin çene gelişimini kontrol etmek ve aileye doğru ağız bakımı eğitimi vermek açısından çok önemlidir.", "yayinda"],
                ["Sistem", "20'lik yaş dişlerimi mutlaka çektirmeli miyim?", "Eğer 20'lik dişleriniz çenede tam ve doğru pozisyonda sürdüyse, kolayca temizlenebiliyorsa ve çevre dokulara zarar vermiyorsa çekilmelerine gerek yoktur. Ancak gömülü kalmışsa, ağrı veya enfeksiyon yaratıyorsa, diğer dişleri sıkıştırıp çapraşıklığa neden oluyorsa çekilmeleri gerekir.", "yayinda"],
                ["Sistem", "Sıcak veya soğuk yiyecek/içeceklerde dişlerim sızlıyor, sebebi nedir?", "Diş hassasiyeti genellikle sert fırçalamaya bağlı diş eti çekilmesi, diş minesi aşınması veya çürük başlangıcı gibi sebeplerden kaynaklanır. Altta yatan nedenin tespiti ve flor uygulaması, hassasiyet giderici macun önerisi veya dolgu gibi tedaviler için kliniğimizi ziyaret edebilirsiniz.", "yayinda"],
                ["Sistem", "Hamilelik döneminde diş tedavisi yaptırılabilir mi?", "Evet, yaptırılabilir. Acil olmayan tedaviler için en güvenli dönem hamileliğin ikinci trimesteridir (3. ve 6. aylar arası). Şiddetli ağrı ve enfeksiyon durumlarında ise, kadın doğum uzmanınızla da konsültasyon yapılarak her dönemde acil müdahale gerçekleştirilebilir.", "yayinda"],
                ["Sistem", "Şeffaf plak (Invisalign) tedavisi benim için uygun mu?", "Şeffaf plaklar, geleneksel tel tedavisine estetik ve konforlu bir alternatiftir ve çapraşıklık, aralıklı dişler gibi pek çok ortodontik sorunun çözümünde kullanılır. Tedaviye uygunluğunuz, yapılacak detaylı bir ortodontik muayene ve dijital tarama sonrasında netleşir.", "yayinda"]
            ];
            for (let faq of initialFaq) {
                await pool.query('INSERT INTO faq (hasta_adi, soru, cevap, durum) VALUES (?, ?, ?, ?)', faq);
            }
        }

        console.log('✅ Veritabanı tabloları başarılı şekilde kontrol edildi/oluşturuldu.');
    } catch (err) {
        console.error('❌ DB Init hatası:', err.message);
        throw err;
    }
}

module.exports = { pool, initDb };
