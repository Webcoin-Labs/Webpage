const express = require("express");
const mongoose = require("mongoose");
const app = express();
const session = require('express-session');
const sharedsession = require("express-socket.io-session");
const bodyparser = require("body-parser");
const socketIO = require("socket.io");

mongoose.connect("mongodb://localhost:27017/WebCoinLABS").then(() => console.log("MongoDB Connected")).catch((err) => console.log(err));
app.use(express.static("./"));
let sessionMiddleware = session({
    secret: "OnlineVotingWebsite",
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 6000000
    }
});
app.use(sessionMiddleware);
app.use(bodyparser.urlencoded({extended: true}));

const server = app.listen(8000, () => {
    console.log("Listening Server at 8000");
});
const io = socketIO(server);

const schema = new mongoose.Schema(
    {
        Email: {
            type: String
        },
        Password: {
            type: String
        }
    }
);
const users = mongoose.model("users", schema);
app.get("/", (req, res) => {
    res.sendFile("signup.html", {root: "./"});
});
app.post("/", async (req, res) => {
    console.log("Added: ", JSON.stringify(req.body));
    const result = await users.create({
        Email: req.body.email,
        Password: req.body.password,
    });
    res.redirect("/login");
});
app.get("/login", (req, res) => {
    res.sendFile("signup.html", {root: "./"});
});


app.get("/home", (req, res) => {
    if (req.session.email) {
        const email = req.session.email;
        res.sendFile("home.html", {root: "./"});

    } else {
        res.send("you are not authorised")
    }
});
app.get("/portfolio", (req, res) => {
    if (req.session.email) {
        const email = req.session.email;
        res.sendFile("portfolio.html", {root: "./"});

    } else {
        res.send("you are not authorised")
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => { // Destroy the session
        res.redirect('/login'); // Redirect to login page
    });
});

io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));
io.on("connection", (socket) => {
   
    socket.on("Login", async (data) => {
        const email = data.email;
        const pass = data.pass;
        console.log(data);
        const result = await users.findOne({Email: email});
        if (result && result.Password === pass) {
            socket.handshake.session.email = data.email;
            socket.handshake.session.save();
            socket.emit("Login", "login Successfull");
        } else {
            socket.emit("Login", "Email or Password is Wrong")
        }
    });
    
    });
