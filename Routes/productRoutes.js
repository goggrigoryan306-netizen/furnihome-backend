import express from "express";

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,

  addProductComment,
  getPendingComments,
  approveComment,
  deleteComment,
} from "../controllers/productController.js";


const router = express.Router();


// IMPORTANT
// specific routes-ը վերևում

router.get(
  "/admin/comments/pending",
  getPendingComments
);


// COMMENTS

router.post(
  "/:id/comments",
  addProductComment
);


router.patch(
  "/:productId/comments/:commentId/approve",
  approveComment
);


router.delete(
  "/:productId/comments/:commentId",
  deleteComment
);


// PRODUCTS

router.get(
  "/",
  getProducts
);


router.get(
  "/:id",
  getProduct
);


router.post(
  "/",
  createProduct
);


router.put(
  "/:id",
  updateProduct
);


router.delete(
  "/:id",
  deleteProduct
);


export default router;