const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Personel Yönetimi API
router.get('/personnel', verifyToken, authController.getPersonnel);
router.post('/personnel', verifyToken, authController.createPersonnel);
router.put('/personnel/:id', verifyToken, authController.updatePersonnel);
router.delete('/personnel/:id', verifyToken, authController.deletePersonnel);

module.exports = router;
