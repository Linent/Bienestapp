const JwtService = require("../services/jwt");

const Auth = (req, res, next) => {
     const jwtService = new JwtService();
    const response = jwtService.decodeToken(req);

    if (!response.success) {
        return res.status(response.status).send({ errors: response.message });
    }

    req.user = response.payload;
    next(); 
};

module.exports = Auth;