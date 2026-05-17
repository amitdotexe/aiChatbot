const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Cookie options centralised so both register and login stay consistent.
// httpOnly prevents client-side JS from reading the token (XSS protection).
// sameSite: "strict" blocks the cookie from being sent on cross-site requests.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 60 * 60 * 1000, // 1 hour — matches the JWT expiry
};

async function register(req, res) {
  try {
    const {
      fullName: { firstName, lastName },
      email,
      password,
    } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      fullName: { firstName, lastName },
      email,
      password: hashPassword,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "User registered successfully",
      fullName: { firstName, lastName },
      email,
      id: newUser._id,
      token,
    });
  } catch (error) {
    console.error("Error in register controller:", error);
    res.status(500).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "User logged in successfully",
      fullName: user.fullName,
      email: user.email,
      id: user._id,
    });
  } catch (error) {
    console.error("Login failed", error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { register, login };
