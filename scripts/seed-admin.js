import "dotenv/config";

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { USER_ROLES } from "../src/shared/constants/index.js";
import { hashPassword } from "../src/shared/security/passwords.js";
import { createUserId } from "../src/modules/users/user.ids.js";
import User from "../src/modules/users/user.model.js";

const name = (process.env.ADMIN_NAME || "KhelYard Admin").trim();
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

const validateSeedInput = () => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must contain a valid email address.");
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 8 characters and at most 72 UTF-8 bytes.",
    );
  }
  if (name.length < 2 || name.length > 80) {
    throw new Error("ADMIN_NAME must contain between 2 and 80 characters.");
  }
};

const seedAdmin = async () => {
  validateSeedInput();
  await connectDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== USER_ROLES.ADMIN) {
      throw new Error("ADMIN_EMAIL is already used by a non-admin account.");
    }
    console.log("Admin already exists; no changes were made.");
    return;
  }

  await User.create({
    userId: createUserId(USER_ROLES.ADMIN),
    name,
    email,
    passwordHash: await hashPassword(password),
    role: USER_ROLES.ADMIN,
    isVerified: true,
    verifiedAt: new Date(),
  });
  console.log("Admin created successfully.");
};

seedAdmin()
  .catch((error) => {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
