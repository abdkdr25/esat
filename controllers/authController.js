const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_buraya_yazilir_daha_karma_bir_sey_olmali';
const COOKIE_MAX_AGE = 60 * 60 * 1000; // 1 saat (ms)

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        let admin = null;
        let isOffline = false;

        try {
            const [users] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
            if (users.length > 0) {
                admin = users[0];
            }
        } catch (dbErr) {
            console.warn('⚠️ DB bağlantısı yok, çevrimdışı mod aktif.');
            isOffline = true;
        }

        if (isOffline) {
            // Çevrimdışı mod: hardcoded admin/12345 ile giriş
            if (username === 'admin' && password === '12345') {
                admin = { id: 1, username: 'admin' };
            } else {
                return res.status(400).json({ success: false, message: 'Çevrimdışı modda yalnızca varsayılan admin hesabıyla giriş yapabilirsiniz.' });
            }
        } else {
            if (!admin) {
                return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
            }

            const validPass = await bcrypt.compare(password, admin.password);
            if (!validPass) {
                return res.status(400).json({ success: false, message: 'Hatalı şifre' });
            }
        }

        // JWT token oluştur
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // HttpOnly cookie'ye yaz (XSS'e karşı güvenli)
        res.cookie('adminToken', token, {
            httpOnly: true,          // JS ile okunamaz
            secure: process.env.NODE_ENV === 'production', // Prod'da HTTPS zorunlu
            sameSite: 'strict',      // CSRF koruması
            maxAge: COOKIE_MAX_AGE
        });

        // Frontend için de token dön (localStorage için geriye dönük uyumluluk)
        res.json({ success: true, token, redirectTo: '/yonetim-paneli' });

    } catch (err) {
        console.error('Login hatası: ', err);
        res.status(500).json({ success: false, message: `Login hatası: ${err.message}` });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('adminToken');
    res.json({ success: true, message: 'Çıkış yapıldı' });
};

// Çevrimdışı mod için bellekte personel listesi
let offlinePersonnel = [
    { id: 1, username: 'admin', created_at: new Date().toISOString() }
];
let offlineNextId = 2;

let _dbAvailable = null;
let _dbCheckTime = 0;

async function isDbAvailable() {
    const now = Date.now();
    if (_dbAvailable !== null && (now - _dbCheckTime) < 30000) {
        return _dbAvailable;
    }
    try {
        await pool.query('SELECT 1');
        _dbAvailable = true;
    } catch {
        _dbAvailable = false;
    }
    _dbCheckTime = now;
    return _dbAvailable;
}

exports.getPersonnel = async (req, res) => {
    try {
        if (await isDbAvailable()) {
            const [rows] = await pool.query('SELECT id, username, created_at FROM admins ORDER BY created_at DESC');
            res.json({ success: true, personnel: rows, count: rows.length });
        } else {
            res.json({ success: true, personnel: offlinePersonnel, count: offlinePersonnel.length, offline: true });
        }
    } catch (err) {
        console.error('getPersonnel hatası:', err);
        // Fallback to offline
        res.json({ success: true, personnel: offlinePersonnel, count: offlinePersonnel.length, offline: true });
    }
};

exports.createPersonnel = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Kullanıcı adı (TC) ve şifre gereklidir.' });
        }

        if (await isDbAvailable()) {
            const [existing] = await pool.query('SELECT id FROM admins WHERE username = ?', [username]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Bu kullanıcı adı (TC) zaten kayıtlı.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashedPassword]);
        } else {
            // Çevrimdışı mod
            const exists = offlinePersonnel.find(p => p.username === username);
            if (exists) {
                return res.status(400).json({ success: false, message: 'Bu kullanıcı adı (TC) zaten kayıtlı.' });
            }
            offlinePersonnel.push({
                id: offlineNextId++,
                username,
                created_at: new Date().toISOString()
            });
        }

        res.json({ success: true, message: 'Yeni personel başarıyla eklendi.' });
    } catch (err) {
        console.error('createPersonnel hatası:', err);
        res.status(500).json({ success: false, message: 'Personel eklenirken bir hata oluştu.' });
    }
};

exports.updatePersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, message: 'Kullanıcı adı (TC) gereklidir.' });
        }

        if (await isDbAvailable()) {
            const [existing] = await pool.query('SELECT id FROM admins WHERE username = ? AND id != ?', [username, id]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Bu kullanıcı adı (TC) başka bir personel tarafından kullanılıyor.' });
            }

            if (password && password.trim() !== '') {
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.query('UPDATE admins SET username = ?, password = ? WHERE id = ?', [username, hashedPassword, id]);
            } else {
                await pool.query('UPDATE admins SET username = ? WHERE id = ?', [username, id]);
            }
        } else {
            // Çevrimdışı mod
            const person = offlinePersonnel.find(p => p.id === parseInt(id));
            if (!person) {
                return res.status(404).json({ success: false, message: 'Personel bulunamadı.' });
            }
            const duplicate = offlinePersonnel.find(p => p.username === username && p.id !== parseInt(id));
            if (duplicate) {
                return res.status(400).json({ success: false, message: 'Bu kullanıcı adı (TC) başka bir personel tarafından kullanılıyor.' });
            }
            person.username = username;
        }

        res.json({ success: true, message: 'Personel bilgileri başarıyla güncellendi.' });
    } catch (err) {
        console.error('updatePersonnel hatası:', err);
        res.status(500).json({ success: false, message: 'Personel güncellenirken bir hata oluştu.' });
    }
};

exports.deletePersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedInAdminId = req.admin.id;

        if (parseInt(id) === parseInt(loggedInAdminId)) {
            return res.status(400).json({ success: false, message: 'Kendi hesabınızı silemezsiniz.' });
        }

        if (await isDbAvailable()) {
            const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM admins');
            if (countRows[0].cnt <= 1) {
                return res.status(400).json({ success: false, message: 'Sistemdeki tek yöneticiyi silemezsiniz.' });
            }

            const [result] = await pool.query('DELETE FROM admins WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Personel bulunamadı.' });
            }
        } else {
            // Çevrimdışı mod
            if (offlinePersonnel.length <= 1) {
                return res.status(400).json({ success: false, message: 'Sistemdeki tek yöneticiyi silemezsiniz.' });
            }
            const idx = offlinePersonnel.findIndex(p => p.id === parseInt(id));
            if (idx === -1) {
                return res.status(404).json({ success: false, message: 'Personel bulunamadı.' });
            }
            offlinePersonnel.splice(idx, 1);
        }

        res.json({ success: true, message: 'Personel kaydı başarıyla silindi.' });
    } catch (err) {
        console.error('deletePersonnel hatası:', err);
        res.status(500).json({ success: false, message: 'Personel silinirken bir hata oluştu.' });
    }
};
