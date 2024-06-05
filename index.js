// Essential Packages
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

// Fundamentals
const app = express();
const port = process.env.PORT || 8080;
const dbName = process.env.DB_NAME || "pswdManager";
// Mongoose

// Middlewares
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(`mongodb://127.0.0.1:27017/${dbName}`)
  .then((res) => {
    console.log(`Database Initialised with the name ${dbName}`);
  })
  .catch((err) => {
    console.log("Database connection error", err);
  })
  .finally(() => {
    console.log("Database connection attempt finished");
  });

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const guestRoute = require("./Routes/guest");

app.get("/", (req, res) => {
  const details = {
    name: "Yaseen",
  };
  res.render("index", { details });
});

app.use("/guest", guestRoute);

app.get("/*", (req, res) => {
  res.status(404).render("error/404");
});

app.listen(port, () => {
  console.log(`Server running at at PORT:${port}`);
});
