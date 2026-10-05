import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://192.168.1.6:5173",
    ],
    credentials: true,
  })
);

// ===============================
// JSON
// ===============================

app.use(express.json());

// ===============================
// UPLOAD
// ===============================

app.use(
  "/upload",
  express.static(
    path.join(process.cwd(), "upload")
  )
);

// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/orders", orderRoutes);

// ===============================
// MONGODB
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB error:", error);
  });

// ===============================
// TEST
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "FurniHome Backend is working!",
  });
});

// ===============================
// VERCEL
// ===============================

export default app;