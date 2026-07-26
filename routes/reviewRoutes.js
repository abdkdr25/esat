const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyToken = require('../middlewares/authMiddleware'); // Import the auth middleware to protect admin routes

// 1. Yeni Yorum Ekleme (Public)
router.post('/', async (req, res) => {
    try {
        const { isim, yorum } = req.body;
        if (!isim || !yorum) {
            return res.status(400).json({ error: "İsim ve yorum alanları zorunludur." });
        }
        
        await pool.query(
            "INSERT INTO yorumlar (isim, yorum, onaylandi_mi) VALUES (?, ?, false)",
            [isim, yorum]
        );
        
        res.status(201).json({ message: "Yorum başarıyla alındı, yönetici onayından sonra yayınlanacaktır." });
    } catch (err) {
        console.error("Yorum ekleme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 2. Onaylanmış Yorumları Listeleme (Public)
router.get('/public', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM yorumlar WHERE onaylandi_mi = true ORDER BY olusturma_tarihi DESC");
        res.json(rows);
    } catch (err) {
        console.error("Yorumları getirme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 3. Tüm Yorumları Listeleme (Admin)
router.get('/admin', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM yorumlar ORDER BY olusturma_tarihi DESC");
        res.json(rows);
    } catch (err) {
        console.error("Admin yorumları getirme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 4. Yorumu Onaylama (Admin)
router.put('/:id/approve', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE yorumlar SET onaylandi_mi = true WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Yorum bulunamadı." });
        }
        
        res.json({ message: "Yorum onaylandı ve yayına alındı." });
    } catch (err) {
        console.error("Yorum onaylama hatası:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 5. Yorumu Silme (Admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM yorumlar WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Yorum bulunamadı." });
        }
        
        res.json({ message: "Yorum başarıyla silindi." });
    } catch (err) {
        console.error("Yorum silme hatası:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

module.exports = router;
