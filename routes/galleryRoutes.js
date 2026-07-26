const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { requireAuth } = require('../middlewares/sessionMiddleware');

// Multer Ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads/gallery');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// GET: Galeriyi Listele (Herkese açık)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM galeri ORDER BY olusturma_tarihi DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Galeri listeleme hatası:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// POST: Yeni Galeri Ekle (Admin yetkisi gerektirir)
router.post('/', requireAuth, upload.fields([{ name: 'eski_foto', maxCount: 1 }, { name: 'yeni_foto', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.files || !req.files['eski_foto'] || !req.files['yeni_foto']) {
            return res.status(400).json({ success: false, message: 'Lütfen eski ve yeni hallerine ait iki fotoğraf da yükleyin.' });
        }

        const eskiFotoPath = '/uploads/gallery/' + req.files['eski_foto'][0].filename;
        const yeniFotoPath = '/uploads/gallery/' + req.files['yeni_foto'][0].filename;

        await pool.query(
            'INSERT INTO galeri (eski_foto, yeni_foto) VALUES (?, ?)',
            [eskiFotoPath, yeniFotoPath]
        );

        res.json({ success: true, message: 'Fotoğraflar galeriye başarıyla eklendi.' });
    } catch (err) {
        console.error('Galeri ekleme hatası:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// DELETE: Galeri öğesi sil (Admin yetkisi gerektirir)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Önce db'den kayıtlı resim yollarını bul
        const [rows] = await pool.query('SELECT eski_foto, yeni_foto FROM galeri WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Galeri öğesi bulunamadı' });
        }

        const item = rows[0];

        // Fiziksel dosyaları sil
        const publicDir = path.join(__dirname, '../public');
        const eskiFilePath = path.join(publicDir, item.eski_foto);
        const yeniFilePath = path.join(publicDir, item.yeni_foto);

        if (fs.existsSync(eskiFilePath)) fs.unlinkSync(eskiFilePath);
        if (fs.existsSync(yeniFilePath)) fs.unlinkSync(yeniFilePath);

        // Veritabanından sil
        await pool.query('DELETE FROM galeri WHERE id = ?', [id]);

        res.json({ success: true, message: 'Galeri öğesi başarıyla silindi.' });
    } catch (err) {
        console.error('Galeri silme hatası:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

module.exports = router;
