const crypto = require("crypto");

const encryptionKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, "hex");

if (!process.env.ENCRYPTION_SECRET_KEY) {
  console.log("Warning: Using a fallback generated key for encryption");
}

const encryptPassword = (password) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "hex"),
    iv
  );
  let encrypted = cipher.update(password, "utf-8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag().toString("base64");
  return {
    encrypted,
    iv,
    tag,
  };
};

const decryptPassword = (encrypted, iv, tag) => {
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(encryptionKey, "hex"),
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    let decrypted = decipher.update(encrypted, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch (err) {
    console.log("Decryption Failed");
  }
};

module.exports = {
  encryptPassword,
  decryptPassword,
};
