const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth, redirectIfAuthenticated } = require('../middlewares/sessionMiddleware');

/**
 * GET /login
 * Zaten giriş yapmışsa panele yönlendir, değilse login sayfasını sun.
 */
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

/**
 * GET /yonetim-paneli
 * JWT doğrulaması yapılır. Token yoksa veya geçersizse /login'e redirect.
 */
router.get('/yonetim-paneli', requireAuth, (req, res) => {
    // Tarayıcı önbelleğini (cache) devre dışı bırak
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    res.sendFile(path.join(__dirname, '../views/panel.html'));
});

module.exports = router;
