const express = require("express");
const  userRouter = require("./routes/user_route");
const errorController = require("./controllers/errorController")
// express application
const app = express();
app.use(express.json());
app.use("/users",userRouter);

// GLOBAL error handler
app.use(errorController);
module.exports = app;
