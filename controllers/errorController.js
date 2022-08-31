module.exports = (err,req,res,_)=>{
   if(process.env.NODE_ENV === "development") {
       sendErrorDev(err,res)
   }else{
       sendErrProduction(err,res);
   }

}


const sendErrProduction=(err,res)=>{
    const statusCode= err.statusCode || 500;
    const status = err.status || "error";
    if(err.isOprational){
        res.json({
            status,
            message:err.message,

        }).status(statusCode);
    }else{
        res.json({
            status:"error",
            message:"something went very wrong."
        }).status(500);
    }



}



const sendErrorDev = (err,res)=>{
    const statusCode = err.statusCode || 500;
    res.json({
        status:err.status,
        err:err,
        message:err.message,
        stack:err.stack
    }).status(statusCode);
}
