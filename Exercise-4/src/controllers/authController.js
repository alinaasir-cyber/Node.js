import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createToken } from "../services/token.js";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError("An account with this email already exists", 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    success: true,
    data: { user: publicUser(user), token: createToken(user) }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Email or password is incorrect", 401);
  }

  res.json({ success: true, data: { user: publicUser(user), token: createToken(user) } });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});
