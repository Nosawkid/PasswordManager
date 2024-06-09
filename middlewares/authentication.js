const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect(401, "/guest/login");
  }
};

module.exports = isAuth;
