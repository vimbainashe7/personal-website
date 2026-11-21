const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const env = require('./config/env');

// Middlewares
const viewGlobals = require('./middleware/viewGlobals');

// Controllers & Routes
const DashboardController = require('./controllers/dashboardController');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Body parsers & utilities
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: false // Set to true in HTTPS production
  }
}));

// Flash messages
app.use(flash());

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Global view locals
app.use(viewGlobals);

// Mount Main Portfolio Route
app.get('/', DashboardController.index);
app.get('/home', (req, res) => res.redirect('/'));

// Auth Routes
app.use('/auth', authRoutes);

// Contact endpoint
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log(`[Contact Form Inquiry] From: ${name} (${email}): ${message}`);
  res.json({ success: true, message: 'Thank you for reaching out! Vimbai will get back to you soon.' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).redirect('/');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[App Error]', err);
  res.status(500).send('Internal Server Error');
});

module.exports = app;
