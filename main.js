"use strict";

const   express = require("express");
const   app = express();
const   router = require("./routes/index");
const   https = require("https")
const   fs = require("fs")
const   layouts = require("express-ejs-layouts");
const   mongoose = require("mongoose");
const   methodOverride = require("method-override");
const   expressSession = require("express-session");
const   MongoStore = require('connect-mongo')(expressSession);
const   cookieParser = require("cookie-parser");
const   connectFlash = require("connect-flash");
const   passport = require("passport");
const   Talent = require("./models/talent");

const mongoURI = "mongodb://localhost:27017/formsDB";
mongoose.Promise = global.Promise;
mongoose.connect(
    mongoURI, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }
)
.then(() => console.log("Connected to MongoDB via mongoose....."))
.catch((err) => console.log(err));

mongoose.set("useCreateIndex", true);

app.set('view engine', 'ejs');
app.set("port", process.env.PORT || 8080);
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(layouts);
app.use(express.static("public"));

app.use(methodOverride("_method", {
    methods: ["POST", "GET"]
}));
app.use(cookieParser("secret_passcode"));
const sessionStore = new MongoStore({ mongooseConnection: mongoose.connection, collection: 'allSessions' });
app.use(expressSession({
    secret:"secret_passcode",
    resave:true,
    saveUninitialized:true,
    name:"Form_Cname_$3cr38",
    store:sessionStore,
    cookie: {
        httpOnly: true,
        secure: true,
        //sameSite: true,
        maxAge: 5*24*60*60*1000 // 5 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds - Time is in milliseconds
    }
}));
app.use(connectFlash());

app.use(passport.initialize());
app.use(passport.session()); //Session must come before this line.
passport.use(Talent.createStrategy()); 

//Talent must be required before this line
passport.serializeUser(Talent.serializeUser());
passport.deserializeUser(Talent.deserializeUser());

app.use((req, res, next) => {
    res.locals.flashMessages = req.flash();
    res.locals.loggedIn = req.isAuthenticated();
    //console.log("Logged" + res.locals.loggedIn);
    res.locals.currentUser = req.user;
    res.locals.file = req.file;
    res.locals.title = "Form";
    next();
});

app.use("/",router);

const port = app.get("port");

const key = fs.readFileSync("localhost-key.pem", "utf-8");
const cert = fs.readFileSync("localhost.pem", "utf-8");


https.createServer({ key, cert }, app).listen(
    port, () => {
        console.log(`Forms: Server running at https://localhost:${port}`);
    }
);

