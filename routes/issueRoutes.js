const express = require("express");
const Issue = require("../models/Issue");
const { auth, adminOnly } = require("../middleware/auth");
const { detectCategory, categories } = require("../utils/classifier");

const router = express.Router();
const allowedStatuses = ["Pending", "In Progress", "Resolved"];

function publicIssue(issue) {
  return {
    _id: issue._id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    city: issue.city,
    address: issue.address,
    image: issue.image,
    status: issue.status,
    statusHistory: issue.statusHistory.map(item => ({
      status: item.status,
      date: item.date
    })),
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt
  };
}

router.get("/categories", (req, res) => {
  res.json({ success: true, categories });
});

// Public statistics for the current month.
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totalReports, pending, inProgress, resolved, uniqueUsers] = await Promise.all([
      Issue.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Issue.countDocuments({ createdAt: { $gte: start, $lt: end }, status: "Pending" }),
      Issue.countDocuments({ createdAt: { $gte: start, $lt: end }, status: "In Progress" }),
      Issue.countDocuments({ createdAt: { $gte: start, $lt: end }, status: "Resolved" }),
      Issue.distinct("userId", { createdAt: { $gte: start, $lt: end } }).then(ids => ids.length)
    ]);

    res.json({ success: true, stats: { totalReports, uniqueUsers, pending, inProgress, resolved } });
  } catch {
    res.status(500).json({ success: false, message: "Could not load statistics" });
  }
});

// Public issue list. Never returns user email/name.
router.get("/public", async (req, res) => {
  try {
    const filter = {};
    const { status, category, city, q } = req.query;

    if (status && status !== "All") filter.status = status;
    if (category && category !== "All") filter.category = category;
    if (city) filter.city = new RegExp(String(city).trim(), "i");
    if (q) {
      const search = new RegExp(String(q).trim(), "i");
      filter.$or = [{ title: search }, { description: search }, { city: search }, { address: search }];
    }

    const issues = await Issue.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, issues: issues.map(publicIssue) });
  } catch {
    res.status(500).json({ success: false, message: "Could not load public issues" });
  }
});

// Public single issue. No personal user data is exposed.
router.get("/public/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    res.json({ success: true, issue: publicIssue(issue) });
  } catch {
    res.status(400).json({ success: false, message: "Invalid issue ID" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, description, city, address, image } = req.body;

    if (!title || !description || !city) {
      return res.status(400).json({ success: false, message: "Title, description and city are required" });
    }

    if (image && (!String(image).startsWith("data:image/") || String(image).length > 7000000)) {
      return res.status(400).json({ success: false, message: "Invalid or oversized image" });
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
  } catch {
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
    if (req.query.status && req.query.status !== "All") filter.status = req.query.status;
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;

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
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    const isOwner = String(issue.userId._id) === String(req.user.id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, issue });
  } catch {
    res.status(400).json({ success: false, message: "Invalid issue ID" });
  }
});

router.put("/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    if (!note || !String(note).trim()) {
      return res.status(400).json({ success: false, message: "Please add a comment for the status update" });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    issue.status = status;
    issue.statusHistory.push({ status, note: String(note).trim() });
    await issue.save();

    res.json({ success: true, issue });
  } catch {
    res.status(400).json({ success: false, message: "Could not update status" });
  }
});

module.exports = router;
