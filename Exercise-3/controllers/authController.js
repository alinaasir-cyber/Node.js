const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials({ name, email, password }, includeName) {
  if (includeName && (typeof name !== "string" || name.trim().length < 2)) {
    return "Name must be at least 2 characters long.";
  }

  if (typeof email !== "string" || !emailPattern.test(email.trim())) {
    return "A valid email is required.";
  }

  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  return null;
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const validationError = validateCredentials({ name, email, password }, true);
    if (validationError) return res.status(400).json({ message: validationError });

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    return res.status(201).json({
      message: "Account created.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const validationError = validateCredentials({ email, password }, false);
    if (validationError) return res.status(400).json({ message: validationError });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return next(err);
  }
}

function profile(req, res) {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
}

module.exports = { register, login, profile };
