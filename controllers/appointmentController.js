const { pool } = require('../config/db');
const { sendAppointmentEmail } = require('../utils/mailConfig');

const { z } = require('zod');
const xss = require('xss');

const appointmentSchema = z.object({
    ad: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır").max(100, "Ad soyad en fazla 100 karakter olmalıdır"),
    telefon: z.string().regex(/^\d{11}$/, "Telefon numarası 11 haneli ve sadece rakam olmalıdır"),
    email: z.string().email("Geçersiz e-posta adresi").optional().or(z.literal('')),
    tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı"),
    saat: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı"),
    notlar: z.string().max(300, "Notlar en fazla 300 karakter olabilir").optional().or(z.literal('')),
    isKvkkAccepted: z.boolean().refine(val => val === true, "KVKK aydınlatma metnini onaylamanız gerekmektedir.")
});

// PUBLIC: Yeni randevu talebi oluştur
exports.createAppointment = async (req, res) => {
    try {
        const { ad, telefon, email, tarih, saat, notlar, isKvkkAccepted } = req.body;

        const temizTelefon = telefon ? telefon.toString().replace(/\s/g, '') : '';
        const kvkkOnayi = isKvkkAccepted === true || isKvkkAccepted === 'true' || isKvkkAccepted === 'on';

        // 1. Zod ile Validasyon ve XSS Sanitization
        const validationResult = appointmentSchema.safeParse({
            ad: ad ? xss(ad.trim()) : '',
            telefon: temizTelefon,
            email: email ? xss(email.trim()) : '',
            tarih,
            saat,
            notlar: notlar ? xss(notlar.trim()) : '',
            isKvkkAccepted: kvkkOnayi
        });

        if (!validationResult.success) {
            return res.status(400).json({ 
                success: false, 
                message: validationResult.error.errors[0].message 
            });
        }

        const validData = validationResult.data;

        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const randevuTarihi = new Date(validData.tarih);
        randevuTarihi.setHours(0, 0, 0, 0);

        if (randevuTarihi < bugun) {
            return res.status(400).json({ success: false, message: "Geçmiş tarih için randevu alınamaz" });
        }

        // 2. Çakışma Kontrolü (Veritabanı) - Hem Approved hem Pending olanları kontrol et
        const [exists] = await pool.query(
            `SELECT id FROM randevular WHERE tarih = ? AND saat = ? AND durum IN ('approved', 'pending')`,
            [validData.tarih, validData.saat]
        );

        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: "Bu tarih ve saat dolu veya onay bekliyor" });
        }

        // 3. Veritabanına Kayıt (Pending olarak)
        const [result] = await pool.query(
            `INSERT INTO randevular (ad, telefon, email, tarih, saat, notlar, durum) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [validData.ad, validData.telefon, validData.email || null, validData.tarih, validData.saat, validData.notlar || null]
        );
        const insertId = result.insertId;

        // Randevu başarıyla veritabanına kaydedildikten sonra arka planda mail gönder
        sendAppointmentEmail(validData.ad, validData.email || null, validData.tarih, validData.saat);

        res.json({ success: true, message: "Randevu talebiniz alınmıştır.", id: insertId });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// PUBLIC: Belli bir tarihteki dolu saatleri getir
exports.getTimesByDate = async (req, res) => {
    try {
        const { tarih } = req.params;

        const [dbRows] = await pool.query(
            `SELECT saat FROM randevular WHERE tarih = ? AND durum IN ('approved', 'pending')`,
            [tarih]
        );

        // MySQL TIME kolonu "09:00:00" formatında dönüyor — frontend "09:00" ile karşılaştırır
        const alinmisSaatler = dbRows.map(r => String(r.saat).substring(0, 5));

        res.json({ success: true, data: alinmisSaatler });
    } catch (err) {
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};

// PROTECTED: Tüm randevuları listele (Server-Side Pagination + Arama + Filtre)
exports.getAllAppointments = async (req, res) => {
    try {
        const sayfaBasina = parseInt(req.query.limit) || 10;
        const sayfa = Math.max(1, parseInt(req.query.sayfa) || 1);
        const offset = (sayfa - 1) * sayfaBasina;

        const arama = req.query.arama ? req.query.arama.trim() : '';
        const durum = req.query.durum || '';
        const tarihFiltre = req.query.tarihFiltre || '';

        let whereClauses = [];
        let params = [];

        // Arama filtresi (ad veya telefon)
        if (arama) {
            whereClauses.push('(ad LIKE ? OR telefon LIKE ?)');
            params.push(`%${arama}%`, `%${arama}%`);
        }

        // Durum filtresi
        if (durum && ['pending', 'approved', 'cancelled'].includes(durum)) {
            whereClauses.push('durum = ?');
            params.push(durum);
        }

        // Tarih filtresi
        const bugun = new Date();
        const bugunStr = bugun.toISOString().split('T')[0];
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);
        const yarinStr = yarin.toISOString().split('T')[0];

        if (tarihFiltre === 'bugun') {
            whereClauses.push('tarih = ?');
            params.push(bugunStr);
        } else if (tarihFiltre === 'yarin') {
            whereClauses.push('tarih = ?');
            params.push(yarinStr);
        } else if (tarihFiltre === 'gecmis') {
            whereClauses.push('tarih < ?');
            params.push(bugunStr);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Toplam kayıt sayısı (sayfalama için)
        const [countRows] = await pool.query(
            `SELECT COUNT(*) as toplam FROM randevular ${whereSQL}`,
            params
        );
        const toplam = countRows[0].toplam;

        // Sayfalı veriyi çek
        const [dbRows] = await pool.query(
            `SELECT * FROM randevular ${whereSQL} ORDER BY tarih ASC, saat ASC LIMIT ? OFFSET ?`,
            [...params, sayfaBasina, offset]
        );

        res.json({
            success: true,
            data: dbRows,
            pagination: {
                toplam,
                sayfa,
                toplamSayfa: Math.ceil(toplam / sayfaBasina),
                sayfaBasina
            }
        });
    } catch (err) {
        console.error("getAllAppointments ERROR:", err);
        // DB bağlantısı yoksa boş veri dön (çevrimdışı mod)
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
            return res.json({
                success: true,
                data: [],
                pagination: { toplam: 0, sayfa: 1, toplamSayfa: 0, sayfaBasina: 10 }
            });
        }
        res.status(500).json({ success: false, message: err.sqlMessage || 'Sunucu hatası' });
    }
};

// PROTECTED: Randevu durumu güncelle
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { durum } = req.body;
        const randevuId = parseInt(id);

        const allowed = ['approved', 'cancelled'];
        if (!allowed.includes(durum)) {
            return res.status(400).json({ success: false, message: "Geçersiz durum" });
        }

        const [randevuRows] = await pool.query("SELECT * FROM randevular WHERE id = ?", [randevuId]);
        if (randevuRows.length === 0) {
            return res.status(404).json({ success: false, message: "Randevu bulunamadı" });
        }
        const randevu = randevuRows[0];

        if (durum === 'approved') {
            const [cakisma] = await pool.query(
                `SELECT id FROM randevular WHERE tarih = ? AND saat = ? AND durum = 'approved' AND id != ?`,
                [randevu.tarih, randevu.saat, randevuId]
            );

            if (cakisma.length > 0) {
                return res.status(400).json({ success: false, message: "Bu tarih ve saat zaten dolu!" });
            }
        }

        await pool.query("UPDATE randevular SET durum = ? WHERE id = ?", [durum, randevuId]);
        res.json({ success: true, message: `Randevu durumu '${durum}' olarak güncellendi` });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};

// PROTECTED: Randevu sil
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const randevuId = parseInt(id);

        const [result] = await pool.query("DELETE FROM randevular WHERE id = ?", [randevuId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Silinecek randevu bulunamadı" });
        }

        res.json({ success: true, message: "Randevu silindi" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};

// PROTECTED: Admin tarafından doğrudan randevu ekleme
exports.createAppointmentAdmin = async (req, res) => {
    try {
        const { ad, telefon, email, tarih, saat, notlar, durum, toplam_tutar, odenen_tutar } = req.body;

        if (!ad || !telefon || !tarih || !saat) {
            return res.status(400).json({ success: false, message: "Zorunlu alanlar eksik" });
        }

        // Çakışma kontrolü (eğer approved olarak ekleniyorsa)
        if (durum === 'approved') {
            const [exists] = await pool.query(
                `SELECT id FROM randevular WHERE tarih = ? AND saat = ? AND durum = 'approved'`,
                [tarih, saat]
            );
            if (exists.length > 0) {
                return res.status(400).json({ success: false, message: "Bu tarih ve saat zaten onaylı başka bir randevuyla dolu!" });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO randevular (ad, telefon, email, tarih, saat, notlar, durum, toplam_tutar, odenen_tutar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ad, telefon, email || null, tarih, saat, notlar || null, durum || 'approved', toplam_tutar || 0.00, odenen_tutar || 0.00]
        );

        res.json({ success: true, message: "Randevu başarıyla eklendi.", id: result.insertId });
    } catch (err) {
        console.error("createAppointmentAdmin ERROR:", err);
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};

// PROTECTED: Randevu güncelle (tüm detaylar ve ödeme bilgileri dahil)
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { ad, telefon, email, tarih, saat, notlar, durum, toplam_tutar, odenen_tutar } = req.body;
        const randevuId = parseInt(id);

        const [exists] = await pool.query("SELECT * FROM randevular WHERE id = ?", [randevuId]);
        if (exists.length === 0) {
            return res.status(404).json({ success: false, message: "Randevu bulunamadı" });
        }

        // Çakışma kontrolü (eğer tarih veya saat güncelleniyorsa ve onaylanmışsa)
        if (durum === 'approved' || (exists[0].durum === 'approved' && !durum)) {
            const finalTarih = tarih || exists[0].tarih;
            const finalSaat = saat || exists[0].saat;
            const [cakisma] = await pool.query(
                `SELECT id FROM randevular WHERE tarih = ? AND saat = ? AND durum = 'approved' AND id != ?`,
                [finalTarih, finalSaat, randevuId]
            );
            if (cakisma.length > 0) {
                return res.status(400).json({ success: false, message: "Bu tarih ve saat zaten onaylı başka bir randevuyla dolu!" });
            }
        }

        await pool.query(
            `UPDATE randevular SET 
                ad = COALESCE(?, ad),
                telefon = COALESCE(?, telefon),
                email = ?,
                tarih = COALESCE(?, tarih),
                saat = COALESCE(?, saat),
                notlar = ?,
                durum = COALESCE(?, durum),
                toplam_tutar = COALESCE(?, toplam_tutar),
                odenen_tutar = COALESCE(?, odenen_tutar)
            WHERE id = ?`,
            [ad, telefon, email, tarih, saat, notlar, durum, toplam_tutar, odenen_tutar, randevuId]
        );

        res.json({ success: true, message: "Randevu başarıyla güncellendi." });
    } catch (err) {
        console.error("updateAppointment ERROR:", err);
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};
