const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/authentication");
const User = require("../Models/Users");
const { encryptPassword, decryptPassword } = require("../Utils/cryptoUtils");

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
    const user = await User.findById(req.session.uuid);
    if (!user) {
      console.log("Invalid User");
      return res.redirect("/guest/login");
    }
    const { encrypted, iv, tag } = encryptPassword(socialPassword);
    const userPasswords = user.passwords;
    const existingSocial = userPasswords.find(
      (el) => el.socialName === socialName
    );
    if (existingSocial) {
      return res.redirect("/user");
    }
    user.passwords.push({
      socialName,
      socialPassword: encrypted,
      passIv: iv.toString("base64"),
      passTag: tag,
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
      const { socialName, socialPassword, passTag, passIv, _id } = el;
      try {
        const decryptedPassword = decryptPassword(
          socialPassword,
          passIv,
          passTag
        );
        return {
          socialName,
          socialPassword: decryptedPassword,
          _id,
        };
      } catch (error) {
        console.log("Decryption Error");
        console.log(error);
        return {
          socialName,
          socialPassword: "",
          _id,
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

router.get("/updatepassword/:passId", async (req, res) => {
  const { passId } = req.params;
  if (!passId) {
    return res.redirect("/user/viewpasswords");
  }
  const user = await User.findById(req.session.uuid);
  const passwords = user.passwords;
  const passToUpdate = passwords.find((el) => el._id.equals(passId));
  res.render("user/updatepassword", { passToUpdate });
});

router.patch("/updatepassword/:passId", async (req, res) => {
  try {
    const { passId } = req.params;
    const { socialName, socialPassword } = req.body;
    const user = await User.findById(req.session.uuid);
    const passToUpdate = user.passwords.id(passId); //Mongoose give id to obtain from sub documents
    if (passToUpdate) {
      const { encrypted, iv, tag } = encryptPassword(socialPassword);
      passToUpdate.socialName = socialName;
      passToUpdate.socialPassword = encrypted;
      passToUpdate.passTag = tag;
      passToUpdate.passIv = iv.toString("base64");
      await user.save();
      res.redirect("/user/viewpasswords");
    } else {
      res.redirect("/user");
    }
  } catch (error) {
    console.log(error);
  }
});

router.delete("/deletepassword/:passId", async (req, res) => {
  const { passId } = req.params;
  const user = await User.findById(req.session.uuid);
  if (!user) {
    return res.redirect("/");
  }
  const passwordIndex = user.passwords.findIndex((el) => el._id.equals(passId));
  user.passwords.splice(passwordIndex, 1);
  await user.save();
  res.redirect("/user/viewpasswords");
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
