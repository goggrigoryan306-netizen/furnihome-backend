import Product from "../models/product.js";


// ================================
// GET ALL PRODUCTS
// ================================

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("-comments")
      .sort({
        createdAt: -1,
      });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց ստանալ ապրանքները",

      error: error.message,
    });
  }
};


// ================================
// GET ONE PRODUCT
// only approved comments
// ================================

export const getProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      ).lean();

    if (!product) {
      return res.status(404).json({
        message:
          "Ապրանքը չի գտնվել",
      });
    }


    // CLIENT-ին տալիս ենք միայն
    // հաստատված comments-ը

    product.comments = (
      product.comments || []
    ).filter(
      (comment) =>
        comment.approved === true
    );


    res.status(200).json(product);

  } catch (error) {
    res.status(500).json({
      message:
        "Սխալ ապրանքը ստանալու ժամանակ",

      error: error.message,
    });
  }
};


// ================================
// CREATE PRODUCT
// ================================

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      categorySlug,
      description,

      price,
      oldPrice,

      image,
      images,

      badge,

      color,
      colors,

      material,
      width,
      height,
      depth,
      warranty,

      inStock,
      isOffer,
    } = req.body;


    if (
      !title ||
      !category ||
      !categorySlug ||
      price === undefined ||
      !image
    ) {
      return res.status(400).json({
        message:
          "Լրացրեք պարտադիր դաշտերը",
      });
    }


    const product =
      await Product.create({
        title,
        category,
        categorySlug,
        description,

        price: Number(price),

        oldPrice:
          oldPrice === "" ||
          oldPrice === null ||
          oldPrice === undefined
            ? null
            : Number(oldPrice),

        image,

        images:
          Array.isArray(images)
            ? images
            : [],

        badge,

        color,

        colors:
          Array.isArray(colors)
            ? colors
            : [],

        material,
        width,
        height,
        depth,
        warranty,

        inStock:
          inStock === undefined
            ? true
            : inStock,

        isOffer:
          isOffer === undefined
            ? false
            : isOffer,
      });


    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց ավելացնել ապրանքը",

      error: error.message,
    });
  }
};


// ================================
// UPDATE PRODUCT
// ================================

export const updateProduct = async (
  req,
  res
) => {
  try {
    // comments-ը չենք թողնում
    // product edit-ից փոխել

    const {
      comments,
      ...updateData
    } = req.body;


    const product =
      await Product.findByIdAndUpdate(
        req.params.id,

        updateData,

        {
          new: true,
          runValidators: true,
        }
      );


    if (!product) {
      return res.status(404).json({
        message:
          "Ապրանքը չի գտնվել",
      });
    }


    res.status(200).json(product);

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց փոփոխել ապրանքը",

      error: error.message,
    });
  }
};


// ================================
// DELETE PRODUCT
// ================================

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );


    if (!product) {
      return res.status(404).json({
        message:
          "Ապրանքը չի գտնվել",
      });
    }


    res.status(200).json({
      message:
        "Ապրանքը հաջողությամբ ջնջվեց",
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց ջնջել ապրանքը",

      error: error.message,
    });
  }
};


// ================================
// USER ADD COMMENT
// ================================

export const addProductComment = async (
  req,
  res
) => {
  try {
    const {
      name,
      text,
      rating,
    } = req.body;


    if (
      !name?.trim() ||
      !text?.trim()
    ) {
      return res.status(400).json({
        message:
          "Լրացրեք անունը և կարծիքը",
      });
    }


    const product =
      await Product.findById(
        req.params.id
      );


    if (!product) {
      return res.status(404).json({
        message:
          "Ապրանքը չի գտնվել",
      });
    }


    let safeRating =
      Number(rating);


    if (
      Number.isNaN(safeRating) ||
      safeRating < 1 ||
      safeRating > 5
    ) {
      safeRating = 5;
    }


    product.comments.push({
      name: name.trim(),

      text: text.trim(),

      rating: safeRating,

      approved: false,
    });


    await product.save();


    res.status(201).json({
      message:
        "Ձեր կարծիքը ուղարկվեց։ Այն կհրապարակվի հաստատումից հետո։",
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց ուղարկել կարծիքը",

      error: error.message,
    });
  }
};


// ================================
// ADMIN GET PENDING COMMENTS
// ================================

export const getPendingComments = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        "comments.approved": false,
      })
        .select(
          "title image category comments"
        )
        .lean();


    const pendingComments = [];


    products.forEach(
      (product) => {

        product.comments
          .filter(
            (comment) =>
              comment.approved === false
          )
          .forEach(
            (comment) => {

              pendingComments.push({
                ...comment,

                productId:
                  product._id,

                productTitle:
                  product.title,

                productImage:
                  product.image,

                productCategory:
                  product.category,
              });

            }
          );

      }
    );


    pendingComments.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );


    res.status(200).json(
      pendingComments
    );

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց ստանալ կարծիքները",

      error: error.message,
    });
  }
};


// ================================
// ADMIN APPROVE COMMENT
// ================================

export const approveComment = async (
  req,
  res
) => {
  try {
    const {
      productId,
      commentId,
    } = req.params;


    const product =
      await Product.findById(
        productId
      );


    if (!product) {
      return res.status(404).json({
        message:
          "Ապրանքը չի գտնվել",
      });
    }


    const comment =
      product.comments.id(
        commentId
      );


    if (!comment) {
      return res.status(404).json({
        message:
          "Կարծիքը չի գտնվել",
      });
    }


    comment.approved = true;


    await product.save();


    res.status(200).json({
      message:
        "Կարծիքը հաստատվեց",
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց հաստատել կարծիքը",

      error: error.message,
    });
  }
};


// ================================
// ADMIN DELETE COMMENT
// ================================

export const deleteComment = async (
  req,
  res
) => {
  try {
    const {
      productId,
      commentId,
    } = req.params;


    const product =
      await Product.findById(
        productId
      );


    if (!product) {
      return res.status(404).json({
        message:
          "Ապրանքը չի գտնվել",
      });
    }


    const comment =
      product.comments.id(
        commentId
      );


    if (!comment) {
      return res.status(404).json({
        message:
          "Կարծիքը չի գտնվել",
      });
    }


    product.comments.pull(
      commentId
    );


    await product.save();


    res.status(200).json({
      message:
        "Կարծիքը ջնջվեց",
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Չհաջողվեց ջնջել կարծիքը",

      error: error.message,
    });
  }
};