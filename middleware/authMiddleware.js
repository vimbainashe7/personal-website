function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/auth/login');
}

function redirectIfAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  next();
}

module.exports = {
  requireAuth,
  redirectIfAuth
};
