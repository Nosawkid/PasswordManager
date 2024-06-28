const express = require("express");
const router = express.Router();
const catchAsync = require("../Utils/catchAsync");

// Essentials
const bcrypt = require("bcrypt");

// Models
const User = require("../Models/Users");
const ExpressError = require("../Utils/expressError");

// Routes

router.get("/login", (req, res) => {
  res.render("guest/login");
});

router.post(
  "/login",
  catchAsync(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      req.session.error = "Please fill the appropriate fields";
      return res.redirect("/guest/login");
    }
    let user = await User.findOne({ username });
    if (user) {
      const isMatchingPassword = await bcrypt.compare(password, user.password);
      if (isMatchingPassword) {
        req.session.isAuth = true;
        req.session.username = user.username;
        req.session.role = "user";
        req.session.uuid = user._id;
        req.session.success = "Successful Login";
        res.redirect("/user");
      } else {
        req.session.error = "Password and Username mismatch";
        return res.redirect("/guest/login");
      }
    } else {
      req.session.error = "Invalid Credentials";
      return res.redirect("/guest/login");
    }
  })
);

router.get("/register", (req, res) => {
  res.render("guest/register");
});

router.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        req.session.error = "Invalid Credentials";
        return res.redirect(400, "/guest/register");
      }
      let user = await User.findOne({ $or: [{ username }, { email }] });
      if (user) {
        req.session.error = "User with the same name or email already exists";
        return res.redirect("/guest/register");
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
      req.session.success = "Account Creation Success";
      res.redirect("/guest/login");
    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  })
);

module.exports = router;
