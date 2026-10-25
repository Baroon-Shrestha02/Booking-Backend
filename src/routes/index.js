import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import adminAuthRoutes from "../modules/auth/adminAuth.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import ownerAuthRoutes from "../modules/auth/ownerAuth.routes.js";
import ownerRoutes from "../modules/owners/owner.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import venueRoutes from "../modules/venues/venue.routes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/admin-auth", adminAuthRoutes);
router.use("/admin", adminRoutes);
router.use("/owner-auth", ownerAuthRoutes);
router.use("/owners", ownerRoutes);
router.use("/users", userRoutes);
router.use("/venues", venueRoutes);

export default router;
