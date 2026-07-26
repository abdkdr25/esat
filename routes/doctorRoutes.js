const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Fotoğraf yükleme ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads/doctors');
        if (!fs.existsSync(dir)){
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

// 1. Doktorları Listeleme (Public & Admin)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM doktorlar ORDER BY olusturma_tarihi ASC");
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Doktorları getirme hatası:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
});

// 2. Doktor Ekleme (Admin)
router.post('/', verifyToken, upload.single('fotograf'), async (req, res) => {
    try {
        const { isim, unvan } = req.body;
        
        if (!isim || !unvan) {
            return res.status(400).json({ success: false, message: "İsim ve ünvan alanları zorunludur." });
        }
        
        let fotografPath = '/video/doctor1.png'; // Fallback
        if (req.file) {
            fotografPath = '/uploads/doctors/' + req.file.filename;
        } else {
             return res.status(400).json({ success: false, message: "Lütfen bir fotoğraf yükleyin." });
        }
        
        await pool.query(
            "INSERT INTO doktorlar (isim, unvan, fotograf) VALUES (?, ?, ?)",
            [isim, unvan, fotografPath]
        );
        
        res.status(201).json({ success: true, message: "Doktor başarıyla eklendi." });
    } catch (err) {
        console.error("Doktor ekleme hatası:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
});

// 3. Doktor Silme (Admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Önce resmi silelim (isteğe bağlı ama iyi pratik)
        const [docs] = await pool.query("SELECT fotograf FROM doktorlar WHERE id = ?", [id]);
        if (docs.length > 0) {
            const photoUrl = docs[0].fotograf;
            if (photoUrl.startsWith('/uploads/')) {
                 const filePath = path.join(__dirname, '../public', photoUrl);
                 if (fs.existsSync(filePath)) {
                     fs.unlinkSync(filePath);
                 }
            }
        }

        const [result] = await pool.query("DELETE FROM doktorlar WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Doktor bulunamadı." });
        }
        
        res.json({ success: true, message: "Doktor başarıyla silindi." });
    } catch (err) {
        console.error("Doktor silme hatası:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
});

module.exports = router;
