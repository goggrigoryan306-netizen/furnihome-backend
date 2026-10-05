import mongoose from "mongoose";

const commentSchema =
  new mongoose.Schema(
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },

      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },
    {
      timestamps: true,
    }
  );

export const Comment =
  mongoose.models.Comment ||
  mongoose.model(
    "Comment",
    commentSchema
  );