const jwt = require("jsonwebtoken");

function generateToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });
}

module.exports = generateToken;
