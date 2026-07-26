const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "gizli_anahtar_buraya_yazilir_daha_karma_bir_sey_olmali";

function verifyToken(req, res, next) {
    // 1. Cookie'den token al (httpOnly, XSS güvenli)
    let token = req.cookies?.adminToken;

    // 2. Yoksa Authorization header'dan al (fallback)
    if (!token) {
        const bearerHeader = req.headers['authorization'];
        if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
            token = bearerHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Token gerekli" });
    }

    jwt.verify(token, JWT_SECRET, async (err, authData) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Geçersiz token" });
        }
        
        try {
            // Kullanıcının veritabanında hala mevcut olup olmadığını kontrol et
            const [users] = await pool.query("SELECT id FROM admins WHERE id = ?", [authData.id]);
            if (users.length === 0) {
                res.clearCookie("adminToken");
                return res.status(401).json({ success: false, message: "Kullanıcı silindi veya bulunamadı" });
            }
        } catch (dbErr) {
            // DB bağlantısı yok, JWT token geçerliyse devam et (çevrimdışı mod)
            console.warn("⚠️ verifyToken: DB bağlantısı yok, JWT ile devam ediliyor.");
        }

        req.admin = authData;
        next();
    });
}

module.exports = verifyToken;
