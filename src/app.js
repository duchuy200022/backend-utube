require("dotenv").config();
const express = require("express");
const app = express();

const morgan = require("morgan");
const { default: helmet } = require("helmet");
const compression = require("compression");

//console.log(`Process::`, process.env);
//init middleware
app.use(morgan("dev")); // combined, common, short, tiny
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

//init db
require("./dbs/init.mongodb");
//const { checkOverload } = require("./helpers/check.connect");
//checkOverload();

//init router
app.use("/", require("./routers"));

//handle error

module.exports = app;
