// Essential Packages
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const engine = require("ejs-mate");
const methodOverride = require("method-override");

// Fundamentals
const app = express();
const port = process.env.PORT || 8080;
const dbName = process.env.DB_NAME || "pswdManager";
// Mongoose

// Middlewares
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Imported middlewares
const isAuth = require("./middlewares/authentication");

// Database
mongoose
  .connect("mongodb://127.0.0.1:27017/" + dbName)
  .then((res) => {
    console.log(`Database Initialised`);
  })
  .catch((err) => {
    console.log("Database connection error", err);
  })
  .finally(() => {
    console.log("Database connection attempt finished");
  });

// Session storing database
const store = new MongoDBSession({
  uri: `mongodb://127.0.0.1:27017/${dbName}`,
  collection: "PasswordAuthSession",
});

// Session config
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  res.locals.path = req.path;
  res.locals.message = {
    error: req.session.error,
    success: req.session.success,
    info: req.session.info,
  };
  delete req.session.error;
  delete req.session.success;
  delete req.session.info;
  next();
});

// View Engine
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const guestRoute = require("./Routes/guest");
const userRoutes = require("./Routes/user");
const ExpressError = require("./Utils/expressError");

app.get("/", (req, res) => {
  const details = {
    name: "Yaseen",
  };
  res.render("index");
});

app.use("/guest", guestRoute);
app.use("/user", isAuth, userRoutes);

app.get("/*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { status = 404 } = err;
  if (!err.message) err.message = "Something Went wrong";
  res.status(status).render("error/404", { err, status });
});

app.listen(port, () => {
  console.log(`Server running at at PORT:${port}`);
});
