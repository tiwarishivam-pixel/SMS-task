const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const publicProfile = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio || "",
  joinedAt: user.createdAt,
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json(publicProfile(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile.", error: error.message });
  }
});

router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { bio, name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }
      user.name = trimmed;
    }

    if (bio !== undefined) {
      user.bio = String(bio).trim().slice(0, 300);
    }

    await user.save();
    return res.status(200).json({ message: "Profile updated.", user: publicProfile(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
});

router.get("/me/bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("eventId", "name venue dateTime")
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch bookings.", error: error.message });
  }
});

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 1) {
      return res.status(400).json({ message: "Enter a search term." });
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const andFilters = terms.map((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
          { bio: { $regex: escaped, $options: "i" } },
        ],
      };
    });

    const users = await User.find(andFilters.length ? { $and: andFilters } : {})
      .select("name email role bio createdAt")
      .limit(30);

    const scored = users
      .map((user) => {
        const lowerQuery = query.toLowerCase();
        const name = user.name.toLowerCase();
        const email = user.email.toLowerCase();
        const bio = (user.bio || "").toLowerCase();
        let score = 0;
        if (name === lowerQuery || email === lowerQuery) score += 100;
        if (name.startsWith(lowerQuery)) score += 50;
        if (email.startsWith(lowerQuery)) score += 40;
        if (name.includes(lowerQuery)) score += 20;
        if (email.includes(lowerQuery)) score += 15;
        if (bio.includes(lowerQuery)) score += 10;
        terms.forEach((term) => {
          const t = term.toLowerCase();
          if (name.includes(t)) score += 5;
          if (email.includes(t)) score += 4;
          if (bio.includes(t)) score += 3;
        });
        return { user, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ user }) => publicProfile(user));

    return res.status(200).json(scored);
  } catch (error) {
    return res.status(500).json({ message: "Search failed.", error: error.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json(publicProfile(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user.", error: error.message });
  }
});

module.exports = router;
