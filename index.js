const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const { urlencoded } = require("body-parser");
const app = express();

const PORT = process.env.PORT || 3000;

// const mongoURI = "mongodb://127.0.0.1:27017/userCredentials";
const mongoURI = process.env.DB;
console.log(process.env.DB);

try {
  // Connect to the MongoDB cluster
  mongoose.connect(
    mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log(" Mongoose is connected")
  );
} catch (e) {
  console.log("could not connect");
}

const dbConnection = mongoose.connection;
dbConnection.on("error", (err) => console.log(`Connection error ${err}`));
dbConnection.once("open", () => console.log("Connected to DB!"));

// mongoose
//   .connect(mongoURI)
//   .then((res) => console.log("db connection success"))
//   .catch((err) => console.log("error"));

const schema = new mongoose.Schema({
  username: { type: String },
  email: { type: String },
  password: { type: String },
  number: { Number },
});

const User = mongoose.model("users", schema);

app.use(bodyParser.json());
app.use(urlencoded({ extended: false }));
// const socket = require('socket.io')
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

// server object returned by createServer is an event emitter
// const server = require('http').createServer()
// server.on('request',(req,res)=>{
//     if(req.url === "/")
//     res.end("<h1>wha'cha y'll doin'</h1>")
// })

const partials_path = path.join(__dirname, "/templates/partials");
const newViews_path = path.join(__dirname, "/templates/views");
// const root_path = path.join(__dirname,'..')

// important otherwise css file will not be applied
// it will give MIME error
const static_path = path.join(__dirname, "/public");
app.use(express.static(static_path));

app.set("view engine", "hbs");
app.set("views", newViews_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
  // res.sendFile(root_path+'/public/index.html')
  res.render("index", {
    home: "Home",
  });
});

app.post("/login", (req, res) => {
  User.findOne({ username: req.body.username }, (err, user) => {
    if (user.password === req.body.password) {
      res.render("dashboard", {
        username: req.body.username,
        home: "Logout",
      });
    } else {
      res.send("Invalid login credentials. Please try again");
    }
  });
});

app.post("/signup", (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    number: req.body.number,
  });
  user.save((err, result) => {
    if (err) {
      res.send("error");
    } else {
      console.log("data added");
    }
  });
  res.render("dashboard", {
    username: req.body.username,
    home: "Logout",
  });
});

server.listen(PORT, () => console.log("port started at 3000"));

// this middleware will ensure that continuous data flow is on
io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  socket.on("chat", (data) => {
    console.log(data);
    socket.broadcast.emit("chat", data);
  });
});

module.exports = app;
