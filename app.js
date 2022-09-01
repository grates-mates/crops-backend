const express = require("express");
const  userRouter = require("./routes/user_route");
const {globalErrorHandler} = require("./controllers/errorController")
// express application
const app = express();
const cors = require('cors');
app.use(cors({origin:"*"}))
app.use(express.json());
app.use("/users",userRouter);

// GLOBAL error handler
app.use(globalErrorHandler);
module.exports = app;
