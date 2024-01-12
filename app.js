var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var helpers = require('handlebars-helpers')();
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var hbs = require("express-handlebars");
const productHelpers = require('./helpers/product-helpers');
const userHelpers = require('./helpers/user-helpers');
var app = express();
var fileUpload = require("express-fileupload");
var db = require("./config/connection");
var session = require("express-session");
const nocache = require("nocache");
const cors = require('cors');

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
    "hbs",
    hbs.engine({
        extname: "hbs",
        defaultLayout: "layout",
        layoutsDir: __dirname + "/views/layout/",
        partialsDir: __dirname + "/views/partials/",
        helpers: helpers
    })
);
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(session({ secret: "key", cookie: { maxAge: 60000000000 } }));
db.connect().then(console.log("db connect success")).catch(console.error);
app.use(async(req, res, next) => {
    try {
        const categoriesData = await productHelpers.getAllCategories();
        res.locals.categoriesData = categoriesData; // Make categories available to views
        let cartCount = null
        if (req.session.user) {
            cartCount = await userHelpers.getCartCount(req.session.user._id)
        }
        res.locals.cartcount = cartCount;
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
});

app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use(nocache());
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;