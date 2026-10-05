import express from "express";

import {
  addProductComment,
  getProductComments,
  getAllComments,
  deleteComment,
} from "../controllers/commentController.js";

import authMiddleware
  from "../middleware/authMiddleware.js";

const router =
  express.Router();


router.get(
  "/",
  getAllComments
);

router.get(
  "/product/:productId",
  getProductComments
);

router.post(
  "/product/:productId",
  authMiddleware,
  addProductComment
);

router.delete(
  "/:id",
  deleteComment
);


export default router;