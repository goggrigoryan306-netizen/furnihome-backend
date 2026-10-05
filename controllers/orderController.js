import Order from "../models/Order.js";
import Product from "../models/product.js";


export const createOrder =
  async (req, res) => {
    try {
      const {
        customer,
        items,
        comment,
        paymentMethod,
      } = req.body;


      if (
        !customer?.name ||
        !customer?.surname ||
        !customer?.phone ||
        !customer?.city ||
        !customer?.address
      ) {
        return res
          .status(400)
          .json({
            message:
              "Լրացրեք առաքման բոլոր տվյալները",
          });
      }


      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "Զամբյուղը դատարկ է",
          });
      }


      const orderItems = [];

      let totalPrice = 0;


      for (
        const item of items
      ) {
        const product =
          await Product.findById(
            item.product
          );


        if (!product) {
          return res
            .status(404)
            .json({
              message:
                "Ապրանքներից մեկը չի գտնվել",
            });
        }


        if (!product.inStock) {
          return res
            .status(400)
            .json({
              message:
                `${product.title} ապրանքը առկա չէ`,
            });
        }


        const quantity =
          Math.max(
            1,
            Number(
              item.quantity
            ) || 1
          );


        const price =
          Number(
            product.price
          );


        totalPrice +=
          price * quantity;


        orderItems.push({
          product:
            product._id,

          title:
            product.title,

          image:
            product.image,

          selectedColor:
            item.selectedColor ||
            "",

          price,

          quantity,
        });
      }


      const order =
        await Order.create({
          user:
            req.userId,

          customer,

          items:
            orderItems,

          comment:
            comment || "",

          paymentMethod:
            paymentMethod ||
            "cash",

          totalPrice,

          status:
            "pending",
        });


      res
        .status(201)
        .json({
          message:
            "Պատվերը հաջողությամբ գրանցվեց",

          order,
        });

    } catch (error) {
      console.log(
        "Create order error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "Չհաջողվեց կատարել պատվերը",
        });
    }
  };