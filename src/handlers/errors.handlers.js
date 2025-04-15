const handlerError = (res, status, message) => {
  res.status(status).json({
    message
  });
};

module.exports = {
  handlerError
};

