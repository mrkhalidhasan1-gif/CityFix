const express = require("express");
const Issue = require("../models/Issue");
const { auth, adminOnly } = require("../middleware/auth");
const { detectCategory, categories } = require("../utils/classifier");

const router = express.Router();

router.get("/categories", (req, res) => {
  res.json({ success: true, categories });
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, description, city, address, image } = req.body;

    if (!title || !description || !city) {
      return res.status(400).json({ success: false, message: "Title, description and city are required" });
    }

    const category = detectCategory(`${title} ${description}`);

    const issue = await Issue.create({
      title,
      description,
      city,
      address: address || "",
      image: image || "",
      category,
      userId: req.user.id,
      statusHistory: [{ status: "Pending", note: "Issue reported by citizen." }]
    });

    res.status(201).json({ success: true, issue });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not create issue" });
  }
});

router.get("/mine", auth, async (req, res) => {
  try {
    const issues = await Issue.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, issues });
  } catch {
    res.status(500).json({ success: false, message: "Could not load issues" });
  }
});

router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const issues = await Issue.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, issues });
  } catch {
    res.status(500).json({ success: false, message: "Could not load admin issues" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("userId", "name email");

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const isOwner = String(issue.userId._id) === String(req.user.id);

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, issue });
  } catch {
    res.status(500).json({ success: false, message: "Could not load issue" });
  }
});

router.put("/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ["Pending", "In Progress", "Resolved"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    issue.status = status;
    issue.statusHistory.push({
      status,
      note: note || `Status changed to ${status}.`
    });

    await issue.save();

    res.json({ success: true, issue });
  } catch {
    res.status(500).json({ success: false, message: "Could not update status" });
  }
});

module.exports = router;
