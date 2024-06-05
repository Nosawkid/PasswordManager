const express = require("express");
const router = express.Router();

// Essentials
const bcrypt = require("bcrypt");

// Models
const User = require("../Models/Users");

router.get("/login", (req, res) => {
  res.render("guest/login");
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
