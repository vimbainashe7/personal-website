const User = require('../models/User');

class AuthController {
  static showLogin(req, res) {
    res.render('auth/login', {
      title: 'Sign In - Vimbainashe Tandire',
      layout: 'layouts/main'
    });
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        req.flash('error', 'Please enter both email and password.');
        return res.redirect('/auth/login');
      }

      const user = await User.findByEmail(email);
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/auth/login');
      }

      const isValid = await User.verifyPassword(password, user.password_hash);
      if (!isValid) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/auth/login');
      }

      // Establish session
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.flash('success', `Welcome back, ${user.name}! 👋`);
      return res.redirect('/');
    } catch (err) {
      console.error('[AuthController.login] Error:', err);
      req.flash('error', 'An error occurred during sign in.');
      return res.redirect('/auth/login');
    }
  }

  static showRegister(req, res) {
    res.render('auth/register', {
      title: 'Create Account - Vimbainashe Tandire',
      layout: 'layouts/main'
    });
  }

  static async register(req, res) {
    try {
      const { name, email, password, confirm_password } = req.body;

      if (!name || !email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/auth/register');
      }

      if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters.');
        return res.redirect('/auth/register');
      }

      if (password !== confirm_password) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/auth/register');
      }

      const existing = await User.findByEmail(email);
      if (existing) {
        req.flash('error', 'An account with that email already exists.');
        return res.redirect('/auth/register');
      }

      const newUser = await User.create({ name, email, password });
      req.session.userId = newUser.id;
      req.session.userName = newUser.name;

      req.flash('success', 'Account successfully created! Welcome to your Academic Portal.');
      return res.redirect('/');
    } catch (err) {
      console.error('[AuthController.register] Error:', err);
      req.flash('error', 'Failed to register account. Please try again.');
      return res.redirect('/auth/register');
    }
  }

  static logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  }
}

module.exports = AuthController;
