const User = require('../models/User');

async function viewGlobals(req, res, next) {
  res.locals.user = null;
  res.locals.currentPath = req.path;
  res.locals.successMsg = req.flash ? req.flash('success') : [];
  res.locals.errorMsg = req.flash ? req.flash('error') : [];

  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.user = user;
      }
    } catch (err) {
      console.warn('[ViewGlobals] Error fetching user session details:', err.message);
    }
  }

  next();
}

module.exports = viewGlobals;
