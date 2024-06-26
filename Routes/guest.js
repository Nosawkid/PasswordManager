const express = require("express");
const router = express.Router();

// Essentials
const bcrypt = require("bcrypt");

// Models
const User = require("../Models/Users");

// Routes

router.get("/login", (req, res) => {
  res.render("guest/login");
});

router.post("/login", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect("/guest/login");
  }
  let user = await User.findOne({ username });
  if (user) {
    const isMatchingPassword = await bcrypt.compare(password, user.password);
    if (isMatchingPassword) {
      req.session.isAuth = true;
      req.session.username = user.username;
      req.session.role = "user";

      res.redirect("/user");
    } else {
      return res.redirect(401, "/guest/login");
    }
  } else {
    return res.redirect(401, "/guest/login");
  }
});

router.get("/register", (req, res) => {
  res.render("guest/register");
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.redirect(400, "/guest/register");
    }
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.redirect(409, "/guest/register");
    }
    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.PASSWORD_SALT)
    );
    user = new User({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.redirect("/guest/login");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;
