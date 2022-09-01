const  AppError = require("../util/appError");
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message,400);
}
const handleJWTError=()=> new AppError('invalid token!please log in again.',401);
const handleJWTTokenExpireError=()=> new AppError('Your Token was expired! please log in again.',401);

const handleDuplicateFieldsDB=(err)=>{
  const listMatch = err.errmsg.match(/".*"/) || [];
  let value = "";
  if(listMatch.length > 0){
    value = listMatch[0];
  }
  const message = `Duplicate Field value : ${value} Please use another value`;
  return new AppError(message,400);
}

const sendErrorDev = (err,res)=>{
  res.status(err.statusCode).json(
    {
      status:err.status,
      err:err,
      message:err.message,
      stack:err.stack
    }
  );
}
const  handleValidationErrorDB = (err)=>{
  const errors = Object.values(err.errors).map((e)=>e.message);
  const message =`Invalid input data : ${errors.join('. ')}`;
  return new AppError(message,400);
}
const sendErrorPod = (err,res)=>{
  if(err.isOperational){
    res.status(err.statusCode).json(
      {
        status:err.status,
        message:err.message
      }
    );
  }else{
    res.status(500).json(
      {
        status:'error',
        message:'something went wrong'
      }
    );
  }
}



module.exports.globalErrorHandler =(err,req,res,next)=>{
  err.statusCode = err.statusCode || 400;
  err.status = err.status || "error";
  if(process.env.NODE_ENV === 'development'){
    sendErrorDev(err,res);
  }else if(process.env.NODE_ENV === 'production'){
    let error=err;
    if(err.name === 'CastError'){
      error = handleCastErrorDB(err);
    }else if(err.code ===11000){
      error = handleDuplicateFieldsDB(err);
    }else if(err.name === 'ValidationError'){
      error = handleValidationErrorDB(err);
    }else if(err.name === 'JsonWebTokenError'){
      error = handleJWTError();
    }else if(err.name === 'TokenExpiredError'){
      error = handleJWTTokenExpireError();
    }
    sendErrorPod(error,res);
  }
}