const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyToken = require('../middlewares/authMiddleware');

// Herkese Açık S.S.S. Listesi (Sadece Yayında Olanlar)
router.get('/public', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM faq WHERE durum = ? ORDER BY olusturma_tarihi DESC', ['yayinda']);
        res.json(rows);
    } catch (err) {
        console.error('FAQ çekme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Hastanın Soru Sorması
router.post('/', async (req, res) => {
    try {
        const { hasta_adi, soru } = req.body;
        if (!hasta_adi || !soru) {
            return res.status(400).json({ error: 'Ad ve soru alanları zorunludur' });
        }
        
        await pool.query('INSERT INTO faq (hasta_adi, soru, durum) VALUES (?, ?, ?)', [hasta_adi, soru, 'bekliyor']);
        res.json({ success: true, message: 'Sorunuz başarıyla iletildi. Doktorumuz tarafından cevaplandığında yayına alınacaktır.' });
    } catch (err) {
        console.error('Soru sorma hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yönetici: Tüm Soruları Listeleme
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM faq ORDER BY olusturma_tarihi DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('FAQ listeleme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yönetici: Soru Cevaplama ve Yayımlama
router.put('/:id/cevapla', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { cevap } = req.body;
        
        if (!cevap) {
            return res.status(400).json({ error: 'Cevap alanı zorunludur' });
        }

        const [result] = await pool.query('UPDATE faq SET cevap = ?, durum = ? WHERE id = ?', [cevap, 'yayinda', id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Soru bulunamadı' });
        }
        
        res.json({ success: true, message: 'Soru cevaplandı ve yayına alındı.' });
    } catch (err) {
        console.error('Soru cevaplama hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yönetici: Soru Silme
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM faq WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Soru bulunamadı' });
        }
        
        res.json({ success: true, message: 'Soru silindi' });
    } catch (err) {
        console.error('Soru silme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
