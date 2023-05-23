// Express automatically knows that this entire function is an error handling middleware by specifying 4 parameters
export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    success: false,
  });
};
