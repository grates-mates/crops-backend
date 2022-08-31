const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        minLength:3,
        maxLength:64
    },
    email:{
        type:String,
        required:true,
        validate:validator.isEmail,
        unique:true
    },
    password:{
        select:false,
        type:String,
        minLength: 6,
        required:true,
    },
    confirmPassword:{
        select:false,
        type:String,
        required:true,
        validate:{
            validator:function (value) {
                return value === this.password;
            },
            message:"Password and Confirm Password should be same."
        }
    },
    passwordChangedAt:Date,
    otp:{
        select:false,
        type:String
    },
    otpExpireOn:{
        select:false,
        type:Date
    }
});


// while saving password to db first convert it to hashed password
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) next();
    if(!this.isNew) this.passwordChangedAt = Date.now();
    this.password = await bcrypt.hash(this.password,12);
    this.confirmPassword = undefined;
    next();
});
userSchema.methods.generateOTP = async function() {
    // 1. generate random string with crypto
    const otp = (await crypto.randomBytes(3)).toString("hex");
    // 2. encrypt otp and save on user db
    this.otp = (await crypto.createHash("sha256").update(otp)).digest("hex");
    this.otpExpireOn = Date.now() + 10 * 60 * 1000;
    // 3. return original otp
    return otp;
}

userSchema.methods.checkPassword = async function (candidatePassword,userPassword) {
    return await bcrypt.compare(candidatePassword,userPassword);
}
userSchema.methods.passwordChangeAfter = function(time){
    if(!this.passwordChangedAt) return false;
    const changeTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000,10);
    return time < changeTimeStamp;
}
const User = mongoose.model("User",userSchema);

module.exports = User;



