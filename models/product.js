import mongoose from "mongoose";


const commentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },

    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    categorySlug: {
      type: String,
      required: true,

      enum: [
        "sofas",
        "bedroom",
        "tables",
        "chairs",
      ],
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      default: null,
    },

    image: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    badge: {
      type: String,
      default: "",
       enum: [
        "NEW",
        "SALE",
        "PREMIUM",
      ],
    },

    color: {
      type: String,
      default: "",
    },

    colors: {
      type: [String],
      default: [],
    },

    material: {
      type: String,
      default: "",
    },

    width: {
      type: String,
      default: "",
    },

    height: {
      type: String,
      default: "",
    },

    depth: {
      type: String,
      default: "",
    },

    warranty: {
      type: String,
      default: "",
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    isOffer: {
      type: Boolean,
      default: false,
    },

    // COMMENTS
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


const Product =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );

export default Product;