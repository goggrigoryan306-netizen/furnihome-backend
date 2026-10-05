import mongoose from "mongoose";

import { Comment } from "../models/Comment.js";


// =============================
// GET PRODUCT COMMENTS
// =============================

export const getProductComments =
  async (req, res) => {

    try {

      const { productId } =
        req.params;


      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {

        return res
          .status(400)
          .json({
            message:
              "Սխալ product ID",
          });

      }


      const comments =
        await Comment.find({
          product: productId,
        }).sort({
          createdAt: -1,
        });


      res.json(comments);

    } catch (error) {

      console.log(
        "Get comments error:",
        error
      );


      res
        .status(500)
        .json({
          message:
            "Չհաջողվեց ստանալ կարծիքները",
        });

    }

  };

export const getAllComments =
  async (req, res) => {
    try {
      const comments =
        await Comment.find()
          .populate(
            "product",
            "title image"
          )
          .sort({
            createdAt: -1,
          });

      res.json(comments);
    } catch (error) {
      console.log(
        "Get comments:",
        error
      );

      res.status(500).json({
        message:
          "Չհաջողվեց ստանալ մեկնաբանությունները",
      });
    }
  };


export const deleteComment =
  async (req, res) => {
    try {
      const comment =
        await Comment.findByIdAndDelete(
          req.params.id
        );

      if (!comment) {
        return res
          .status(404)
          .json({
            message:
              "Մեկնաբանությունը չի գտնվել",
          });
      }

      res.json({
        message:
          "Մեկնաբանությունը ջնջվեց",
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Չհաջողվեց ջնջել մեկնաբանությունը",
      });
    }
  };
// =============================
// ADD COMMENT
// =============================

export const addProductComment =
  async (req, res) => {

    try {

      const { productId } =
        req.params;

      const {
        name,
        text,
        rating,
      } = req.body;


      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {

        return res
          .status(400)
          .json({
            message:
              "Սխալ product ID",
          });

      }


      if (
        !name?.trim() ||
        !text?.trim()
      ) {

        return res
          .status(400)
          .json({
            message:
              "Անունը և կարծիքը պարտադիր են",
          });

      }


      const numericRating =
        Number(rating);


      if (
        numericRating < 1 ||
        numericRating > 5
      ) {

        return res
          .status(400)
          .json({
            message:
              "Գնահատականը պետք է լինի 1-ից 5",
          });

      }


      const comment =
        await Comment.create({
          product: productId,

          user: req.userId,

          name:
            name.trim(),

          text:
            text.trim(),

          rating:
            numericRating,
        });

      res
        .status(201)
        .json(comment);


    } catch (error) {

      console.log(
        "Add comment error:",
        error
      );


      res
        .status(500)
        .json({
          message:
            "Չհաջողվեց ավելացնել կարծիքը",
        });

    }

  };