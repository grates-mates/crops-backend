const User = require("../models/user")
const catchAsync = require('../util/cactchAsync');
const jwt = require("jsonwebtoken");
const AppError = require("../util/appError")
const {promisify} = require("util");
const sendMail = require("../util/email")
const crypto = require("crypto");
// signup
exports.signup = catchAsync(async (req,res,next)=>{
        const user = {
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            confirmPassword:req.body.confirmPassword,
        };
        const createdUser = await User.create(user);
        createSendToken(createdUser,201,res);
});
// login
exports.login = catchAsync(async(req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;
    // 1. check email and password was provided by user or not
    if(!email || !password) return next(new AppError("Email and Password is required for login.",401));
    // 2. find account based on email and match password
    const user = await User.findOne({email:req.body.email}).select("+password");
    if(!user) return next(new AppError("Email or Password is wrong please provided correct accounts details.",401));
    const isMatch = await user.checkPassword(req.body.password,user.password);
    if(!isMatch) return next(new AppError("Email or Password is wrong please provided correct accounts details.",401));
    // 3. if everything ok generates and send JWT to client
    createSendToken(user,200,res)
});
// protection of routes
exports.protect = catchAsync(async (req,res,next)=>{
    //1. check token was provided on header
    const authorization = req.headers.authorization;
    let token;
    if(authorization && authorization.startsWith("Bearer ")) {
        token = authorization.split(" ")[1];
    }
    if(!token) throw new AppError("You are not log in. please log in to get access.",401);

    //2. validate or decode token
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    //3. check user still exist
    const user = await  User.findById(decoded.id);
    if(!user) throw  new AppError("User no longer exits.",401)
    //4. check password changed after token issued
    if(user.passwordChangeAfter(decoded.iat) ) throw  new AppError("User recently changed the password please log in again.",401);
    //5. call next middleware
    req.user = user;
    next();
});

// forget password
const forgetPassword = catchAsync(async (req,res,next) =>{
    // 1. check user exits based on provided email
    if(!req.body.email) throw  new AppError("please provide a valid email address.",404);
    const user = await User.findOne({email:req.body.email});
    if(!user) throw  new AppError("there is no user exits based on provided email.",404);
    // 2. generate OTP
    const otp =  await user.generateOTP();
    user.save({validateBeforeSave:false});
    // 3. send otp to user mail
    await sendMail({
        email:user.email,
        subject:"Password Reset OTP (expire within 10min)",
        message:`${otp} this is your password reset OTP don't share with anyone.`
    });

    res.json({
        status:"success"
    }).status(200);
});

const resetPassword = catchAsync(async(req,res,next)=>{
    // 1. otp present in req params get hashed otp from this
    const hashedOtp =  (await crypto.createHash("sha256").update(req.params.otp)).digest("hex");

    // 2. get user based on hashedOTP
    const user = await  User.findOne({otp:hashedOtp,otpExpireOn:{
            $gte:Date.now()
        }});
    if(!user) throw  new AppError("user not exist or otp expire",404);

    // 3. update password and remove otp details
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.otp = undefined;
    user.otpExpireOn = undefined;
    await user.save();
    createSendToken(user,201,res);
});


// update password
const  updatePassword = catchAsync(async (req,res,next)=>{
   req.user.password = req.body.password;
   req.user.confirmPassword = req.body.confirmPassword;

   await req.user.save();
   createSendToken(req.user,201,res);
});

const getUser = (req,res,next)=>{
    res.json(
        {
            status:"success",
            data:{
                user:req.user
            }
        }
    ).status(200);
}



const getJWTById= id=>{
    return  jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_LIFETIME
    });
}
const createSendToken = (user,statusCode,res)=>{
    const token = getJWTById(user._id);
    user.password = undefined;
    res.json({
        status:"success",
        token,
        data:{
            user
        }
    }).status(statusCode);
}
module.exports = {
    ...exports,
    forgetPassword,
    resetPassword,
    updatePassword,
    getUser
}
