require("dotenv").config();

const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const seedAdmin = require("./config/seedAdmin");
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "CityFix API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startServer() {
  try {
    await connectDB();
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`CityFix running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed:", error.message);
    process.exit(1);
  }
}

startServer();
