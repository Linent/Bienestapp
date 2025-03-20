const JwtService = require("../services/jwt");

const Auth = (req, res, next) => {
  const jwtService = new JwtService();
  const response = jwtService.decodeToken(req, res);

  if (response.success) {
    req.user = response.payload;
    next();
  }
};

module.exports = Auth;
