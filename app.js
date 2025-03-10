const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

const app = express();

const User = require("./models/user");
const LocalStrategy = require("passport-local");

app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const MongoUrl = "mongodb://127.0.0.1:27017/trasho";

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log("Error:", err);
    });

async function main() {
    await mongoose.connect(MongoUrl);
};

const sessionOptions = {
    secret: "mysecretstring",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Dashboard route

app.get("/trasho", (req, res) => {
    res.render("dashboard");
});

app.get("/trasho/howitworks", (req, res) => {
    res.render("howItWorks");
});

// Auth get routes

app.get("/trasho/signup", (req, res) => {
    res.render("auth/signup");
});

app.get("/trasho/login", (req,res) => {
    res.render("auth/login");
});

// Auth post routes

app.post("/trasho/signup", async (req, res, next) => {
    try {
        const { username, password, age } = req.body.user;

        const newUser = new User({ username, age, avatar: "" });

        await User.register(newUser, password);

        req.login(newUser, (err) => {
            if (err) return next(err);
            res.redirect("/trasho/avatar"); // Redirect to avatar creation page
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("Error signing up: " + err.message);
    }
});

app.post("/trasho/login", passport.authenticate("local", {
    successRedirect: "/trasho/home",  // Redirect to games page on success
    failureRedirect: "/trasho/login",  // Redirect back to login on failure
    failureFlash: true // Enable flash messages for errors (optional, requires connect-flash)
}));

// Avatar routes

app.get("/trasho/avatar", (req, res) => {
    res.render("user/avatar"); // This will render avatar.ejs
});

app.post("/trasho/avatar", async (req, res) => {
    try {
        const { avatar } = req.body.user; // Extract avatar URL from request body
        const userId = req.user?._id || "67cdd77067fd97e630efb291"; // Use logged-in user's ID, fallback to a default

        // Find the user and update the avatar field
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { avatar: avatar } }, // Update avatar field
            { new: true } // Return the updated document
        );

        res.redirect("/trasho/home");
    } catch (error) {
        console.error("Error updating avatar:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User home routes

app.get("/trasho/home", async (req, res) => {
    try {
        const userId = req.user?._id || "67cdd77067fd97e630efb291"; // Default user ID if not logged in
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.render("user/home", { user });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/trasho/chapters", (req, res) => {
    res.render("user/chapters");
});

// Games routes

app.get("/trasho/drag&drop", (req, res) => {
    res.render("games/drag&drop");
});

app.get("/trasho/wastesorting", (req, res) => {
    res.render("games/wastesorting");
});

// Server is listening on port 8080

app.listen(8080, () => {
    console.log("App is listening on port http://localhost:8080/trasho");
});
