const express = require("express");gi 
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const User = require("./models/User");

const path = require("path");
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware to check JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Invalid token format." });
  }

  try {
    const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verifiedUser;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
}

// Test route
app.get("/", (req, res) => {
  res.redirect("login.html");
});

// Temporary registration route for testing
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, email, phone, dob } = req.body;

    if (!username || !password || !email || !phone || !dob) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      phone,
      dob
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Incorrect username or password." });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({ message: "Incorrect username or password." });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful.",
      token
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login." });
  }
});

// Get logged-in user profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error while loading profile." });
  }
});

// Update logged-in user profile
app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { email, phone, dob } = req.body;

    if (!email || !phone || !dob) {
      return res.status(400).json({ message: "Email, phone, and date of birth are required." });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const phonePattern = /^[0-9]+$/;

    if (!phonePattern.test(phone)) {
      return res.status(400).json({ message: "Phone number must contain numbers only." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        email,
        phone,
        dob
      },
      {
        new: true
      }
    ).select("-password");

    res.json({
      message: "Profile updated successfully.",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while updating profile." });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});