const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/authentication");
const crypto = require("crypto");
const encryptionKey =
  process.env.ENCRYPTION_SECRET_KEY || crypto.randomBytes(48).toString("hex");

if (!process.env.ENCRYPTION_SECRET_KEY) {
  console.log("Warning: Using a fallback generated key for encryption");
}

router.get("/", (req, res) => {
  const details = {
    name: req.session.username,
  };
  res.render("user/profile", { details });
});

router.get("/addPassword", (req, res) => {
  res.render("user/addPassword");
});

router.post("/addpassword", async (req, res) => {
  const { socialName, socialPassword } = req.body;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr");
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
