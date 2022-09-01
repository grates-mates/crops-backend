const express = require("express");
const  authController = require("../controllers/authController");
const router = express.Router();
router.post("/signup",authController.signup);
router.post("/login",authController.login);
router.post("/forgetPassword",authController.forgetPassword)
router.patch("/resetPassword/:otp",authController.resetPassword);
router.patch("/updatePassword",authController.protect,authController.updatePassword);
router.get("/me",authController.protect,authController.getUser);


router.get("/",authController.protect,(req,res,next)=>{
    res.json({
        s:"s"
    });
});
module.exports = router;
