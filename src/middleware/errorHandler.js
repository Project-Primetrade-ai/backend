const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message =
    err.message || 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorHandler;

