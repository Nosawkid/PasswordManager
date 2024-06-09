const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/authentication");

router.get("/", isAuth, (req, res) => {
  const details = {
    name: req.session.username,
  };
  res.render("user/profile", { details });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
