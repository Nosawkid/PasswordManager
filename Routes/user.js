const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/authentication");
const User = require("../Models/Users");
const { encryptPassword, decryptPassword } = require("../Utils/cryptoUtils");
const catchAsync = require("../Utils/catchAsync");

router.get(
  "/",
  catchAsync(async (req, res) => {
    const details = {
      name: req.session.username,
    };
    const user = await User.findById(req.session.uuid);
    const numberofPasswords = user.passwords.length;
    res.render("user/profile", { details, numberofPasswords });
  })
);

router.get("/addPassword", (req, res) => {
  res.render("user/addPassword");
});

router.post(
  "/addpassword",
  catchAsync(async (req, res) => {
    const { socialName, socialPassword } = req.body;
    const user = await User.findById(req.session.uuid);
    if (!user) {
      req.session.error = "Invalid User";
      return res.redirect("/guest/login");
    }
    const { encrypted, iv, tag } = encryptPassword(socialPassword);
    const userPasswords = user.passwords;
    const existingSocial = userPasswords.find(
      (el) => el.socialName === socialName
    );
    if (existingSocial) {
      req.session.error = `Social with the name ${socialName} already exists`;
      return res.redirect("/user");
    }
    user.passwords.push({
      socialName,
      socialPassword: encrypted,
      passIv: iv.toString("base64"),
      passTag: tag,
    });
    await user.save();
    req.session.success = "Password Added successfully";
    res.redirect("/user");
  })
);

router.get(
  "/viewpasswords",
  catchAsync(async (req, res) => {
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
    res.render("user/viewpasswords", { userPasswords });
  })
);

router.get(
  "/updatepassword/:passId",
  catchAsync(async (req, res) => {
    const { passId } = req.params;
    if (!passId) {
      req.session.error = "Invalid Password ID";
      return res.redirect("/user/viewpasswords");
    }
    const user = await User.findById(req.session.uuid);
    const passwords = user.passwords;
    const passToUpdate = passwords.find((el) => el._id.equals(passId));
    res.render("user/updatepassword", { passToUpdate });
  })
);

router.patch(
  "/updatepassword/:passId",
  catchAsync(async (req, res) => {
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
      req.session.success = "Password Updated";
      res.redirect("/user/viewpasswords");
    } else {
      res.redirect("/user");
    }
  })
);

router.delete(
  "/deletepassword/:passId",
  catchAsync(async (req, res) => {
    const { passId } = req.params;
    const user = await User.findById(req.session.uuid);
    if (!user) {
      return res.redirect("/");
    }
    const passwordIndex = user.passwords.findIndex((el) =>
      el._id.equals(passId)
    );
    user.passwords.splice(passwordIndex, 1);
    await user.save();
    req.session.success = "Password Deleted";
    res.redirect("/user/viewpasswords");
  })
);

router.get(
  "/similarpasscount",
  catchAsync(async (req, res) => {
    const user = await User.findById(req.session.uuid);
    const userPasswords = user.passwords;
    const decryptedPasswords = userPasswords.map((el) =>
      decryptPassword(el.socialPassword, el.passIv, el.passTag)
    );
    if (decryptedPasswords.length < 2) return;
    const duplicatesExist =
      new Set(decryptedPasswords).size !== decryptedPasswords.length;
    res.json({ duplicatesExist });
  })
);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
