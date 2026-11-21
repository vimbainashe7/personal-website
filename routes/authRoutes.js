const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirectIfAuth } = require('../middleware/authMiddleware');

router.get('/login', redirectIfAuth, AuthController.showLogin);
router.post('/login', redirectIfAuth, AuthController.login);

router.get('/register', redirectIfAuth, AuthController.showRegister);
router.post('/register', redirectIfAuth, AuthController.register);

router.post('/logout', AuthController.logout);
router.get('/logout', AuthController.logout);

module.exports = router;
