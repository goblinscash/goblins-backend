const express = require("express");
const path = require("path");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

require("./cron");
app.use(express.json());
app.use(express.static(path.join(__dirname, "/public")));
app.use("/public", express.static(__dirname + "/public"));

app.use(cors());
// Use helmet for general security headers
app.use(helmet());

// Use cors to set allowed origin

app.use(cookieParser());
app.use(bodyParser.json({ limit: "150mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "150mb",
  })
);

// app.use(cors(corsOptions));

//Environment Setup

let env = require("./config/env.prod.json");

global.env = env;
//all routes
require("./routes/mainRoutes")(app);

module.exports = app;
