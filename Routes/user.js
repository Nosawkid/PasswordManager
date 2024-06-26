const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/authentication");
const crypto = require("crypto");
const User = require("../Models/Users");
const encryptionKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, "hex");

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
  try {
    const { socialName, socialPassword } = req.body;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(encryptionKey, "base64"),
      iv
    );
    let cipherText = cipher.update(socialPassword, "utf-8", "base64");
    cipherText += cipher.final("base64");
    const tag = cipher.getAuthTag().toString("base64");
    const user = await User.findById(req.session.uuid);
    user.passwords.push({
      socialName,
      socialPassword: cipherText,
      passTag: tag,
    });

    await user.save();
    res.redirect("/user");
  } catch (error) {
    console.log("Error");
    console.log(error);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
