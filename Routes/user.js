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
      passIv: iv.toString("base64"),
    });

    await user.save();
    res.redirect("/user");
  } catch (error) {
    console.log("Error");
    console.log(error);
  }
});

router.get("/viewpasswords", async (req, res) => {
  try {
    const uid = req.session.uuid;
    const user = await User.findById(uid);
    const userPasswords = user.passwords.map((el) => {
      const { socialName, socialPassword, passTag, passIv } = el;
      try {
        const decipher = crypto.createDecipheriv(
          "aes-256-gcm",
          Buffer.from(encryptionKey, "hex"),
          Buffer.from(passIv, "base64")
        );
        decipher.setAuthTag(Buffer.from(passTag, "base64"));
        let decryptedPassword = decipher.update(
          socialPassword,
          "base64",
          "utf-8"
        );
        decryptedPassword += decipher.final("utf-8");
        return {
          socialName,
          socialPassword: decryptedPassword,
        };
      } catch (error) {
        return {
          socialName,
          socialPassword: "",
        };
      }
    });
    console.log(userPasswords);
    res.render("user/viewpasswords", { userPasswords });
  } catch (error) {
    console.log("General Error");
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
