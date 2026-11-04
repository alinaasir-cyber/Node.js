const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "A valid bearer token is required." });
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.sub) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return next(err);
  }
}

module.exports = protect;
