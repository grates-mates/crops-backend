// setting environment variable from config file
require('dotenv').config({
    path:`${__dirname}/config.env`
})
const  mongoose = require("mongoose");
const app = require('./app');
const db = process.env.DATABASE.replace("<password>",process.env.DATABASE_PASSWORD);

mongoose.default.connect(db, {
    retryWrites: true,
}).then(r =>console.log("connected to database"))
    .catch(e=>console.log("DB error"));
// run application server
app.listen(3000,()=>{
    console.log("Server running...")
});
