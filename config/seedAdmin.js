const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@civic.gov.in").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await User.findOne({ email });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name: "Civic Admin",
      email,
      password: passwordHash,
      role: "admin"
    });

    console.log(`Admin created: ${email}`);
  }
}

module.exports = seedAdmin;
