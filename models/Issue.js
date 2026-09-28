const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    statusHistory: [
      {
        status: String,
        note: String,
        date: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
