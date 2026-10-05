import {
  register,
  verifyEmail,
  login,
  getMe,
  changePassword,
  getUsers,
  getUserDetails,
  getMyDetails,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import uploadAvatar from "../middleware/uploadAvatar.js";

import express from "express";

const router = express.Router();

// =================================
// AUTH
// =================================

router.post("/register", register);

router.post("/login", login);

router.get("/verify/:token", verifyEmail);

// =================================
// FORGOT PASSWORD
// =================================

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

// =================================
// CHANGE PASSWORD
// =================================

router.put(
  "/change-password",
  authMiddleware,
  changePassword
);

// =================================
// USERS
// =================================

router.get(
  "/",
  getUsers
);

router.get(
  "/users/:userId/details",
  getUserDetails
);

// =================================
// CURRENT USER
// =================================

router.get(
  "/me/details",
  authMiddleware,
  getMyDetails
);

router.get(
  "/me",
  authMiddleware,
  getMe
);

// =================================
// AVATAR
// =================================

router.post(
  "/me/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"),
  uploadMyAvatar
);

router.delete(
  "/me/avatar",
  authMiddleware,
  deleteMyAvatar
);

// =================================
// PROFILE
// =================================

router.put(
  "/me/profile",
  authMiddleware,
  updateMyProfile
);

export default router;