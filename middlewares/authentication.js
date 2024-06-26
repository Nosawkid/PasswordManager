const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/guest/login");
  }
};

module.exports = isAuth;
