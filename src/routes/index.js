import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import ownerAuthRoutes from "../modules/auth/ownerAuth.routes.js";
import ownerRoutes from "../modules/owners/owner.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/owner-auth", ownerAuthRoutes);
router.use("/owners", ownerRoutes);
router.use("/users", userRoutes);

export default router;
