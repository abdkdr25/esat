require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { initDb } = require('./config/db');

const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rotalar
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const articleRoutes = require('./routes/articleRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const pageRoutes = require('./routes/pageRoutes');
const faqRoutes = require('./routes/faqRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());   // ← Cookie okuma için gerekli

// Statik Dosyalar (Frontend)
const staticOptions = {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
        else if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        else if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/resimler', express.static(path.join(__dirname, 'resimler'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), staticOptions));

// Korumalı Sayfa Rotaları (önce gelsin — /login ve /yonetim-paneli)
app.use('/', pageRoutes);

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/faq', faqRoutes);

// Health Check / Uyanık Kal Endpoint'i
app.get('/ping', async (req, res) => {
    try {
        const { pool } = require('./config/db');
        await pool.query('SELECT 1');
        res.status(200).send('Sunucu ve Veritabanı Ayakta!');
    } catch (error) {
        console.error('Healthcheck hatası: ', error.message);
        res.status(500).send('Hata: ' + error.message);
    }
});

// Veritabanını Başlat ve Sunucuyu Dinle
initDb()
    .then(() => {
        console.log('✅ Veritabanı başarıyla başlatıldı.');
    })
    .catch(err => {
        console.error('⚠️ Veritabanı bağlantısı kurulamadı (Çevrimdışı modda çalışılıyor):', err.message);
    });

app.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
    console.log(`🔒 Admin paneli: http://localhost:${PORT}/yonetim-paneli`);
    console.log(`🔑 Login sayfası: http://localhost:${PORT}/login`);
});
