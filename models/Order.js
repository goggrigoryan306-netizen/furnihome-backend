import mongoose from "mongoose";


const orderItemSchema =
  new mongoose.Schema(
    {
      product: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Product",

        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      image: {
        type: String,
        default: "",
      },

      selectedColor: {
        type: String,
        default: "",
      },

      price: {
        type: Number,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    {
      _id: false,
    }
  );


const orderSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
        default: null,
        index: true,


        required: true,
      },


      customer: {
        name: {
          type: String,
          required: true,
        },

        surname: {
          type: String,
          required: true,
        },

        phone: {
          type: String,
          required: true,
        },

        city: {
          type: String,
          required: true,
        },

        address: {
          type: String,
          required: true,
        },
      },


      items: {
        type: [
          orderItemSchema,
        ],

        required: true,
      },


      comment: {
        type: String,
        default: "",
      },


      paymentMethod: {
        type: String,

        enum: [
          "cash",
          "card",
        ],

        default:
          "cash",
      },


      totalPrice: {
        type: Number,
        required: true,
      },


      status: {
        type: String,

        enum: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ],

        default:
          "pending",
      },
    },
    {
      timestamps: true,
    }
  );


const Order =
  mongoose.model(
    "Order",
    orderSchema
  );


export default Order;