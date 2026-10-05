import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";

dotenv.config();

import User from "../models/User.js";
import Order from "../models/Order.js";
import { Comment } from "../models/comment.js";


// ======================================================
// TELEGRAM
// ======================================================

const sendTelegramMessage = async (message) => {
  try {
    const token =
      process.env.TELEGRAM_BOT_TOKEN;

    const chatId =
      process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.log(
        "Telegram env variables are missing"
      );

      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data =
      await response.json();

    if (!data.ok) {
      console.log(
        "Telegram error:",
        data
      );
    }
  } catch (error) {
    console.log(
      "Telegram send error:",
      error.message
    );
  }
};


// ======================================================
// REGISTER
// ======================================================

export const register = async (
  req,
  res
) => {
  try {
    const {
      name,
      surname,
      email,
      password,
    } = req.body;

    if (
      !name ||
      !surname ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Լրացրեք բոլոր դաշտերը",
        });
    }

    const existingUser =
      await User.findOne({
        email:
          email
            .trim()
            .toLowerCase(),
      });

    if (existingUser) {
      return res
        .status(400)
        .json({
          message:
            "Այս email-ով օգտատեր արդեն գոյություն ունի",
        });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({
          message:
            "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ",
        });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const user =
      await User.create({
        name: name.trim(),

        surname:
          surname.trim(),

        email:
          email
            .trim()
            .toLowerCase(),

        password:
          hashedPassword,
      });


    // TELEGRAM

    await sendTelegramMessage(`
🆕 <b>Նոր գրանցում</b>

👤 Անուն: ${user.name}
👤 Ազգանուն: ${user.surname}
📧 Email: ${user.email}

🆔 User ID: ${user._id}
📅 Ամսաթիվ: ${new Date().toLocaleString(
      "hy-AM"
    )}
`);


    // EMAIL VERIFICATION TOKEN

    const verificationToken =
      jwt.sign(
        {
          userId: user._id,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "1h",
        }
      );


    // EMAIL TRANSPORTER

    const transporter =
      nodemailer.createTransport({
        host: "smtp.gmail.com",

        port: 465,

        secure: true,

        auth: {
          user:
            process.env
              .EMAIL_USER,

          pass:
            process.env
              .EMAIL_PASS,
        },
      });


    const serverUrl =
      process.env.SERVER_URL ||
      `http://localhost:${process.env.PORT}`;

    const verificationLink =
      `${serverUrl}/api/auth/verify/${verificationToken}`;


    await transporter.sendMail({
      from:
        process.env.EMAIL_USER,

      to: user.email,

      subject:
        "FurniHome - Email հաստատում",

      html: `
        <h2>Բարի գալուստ FurniHome</h2>

        <p>
          Հաստատեք ձեր email հասցեն։
        </p>

        <a href="${verificationLink}">
          Հաստատել email-ը
        </a>
      `,
    });


    return res
      .status(201)
      .json({
        message:
          "Գրանցումը հաջողվեց։ Ստուգեք ձեր email-ը։",
      });
  } catch (error) {
    console.log(
      "Register error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Server error",
      });
  }
};


// ======================================================
// VERIFY EMAIL
// ======================================================

export const verifyEmail = async (
  req,
  res
) => {
  try {
    const { token } =
      req.params;

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {
      return res
        .status(404)
        .send(
          "User not found"
        );
    }

    if (user.isVerified) {
      return res.send(
        "Email-ը արդեն հաստատված է"
      );
    }

    user.isVerified = true;

    await user.save();

    return res.send(`
      <h1>
        Email-ը հաջողությամբ հաստատվեց ✅
      </h1>

      <a href="${process.env.CLIENT_URL}/login">
        Մուտք գործել
      </a>
    `);
  } catch (error) {
    console.log(
      "Verify email error:",
      error
    );

    return res
      .status(400)
      .send(
        "Verification link-ը սխալ է կամ ժամկետանց"
      );
  }
};


// ======================================================
// LOGIN
// ======================================================

export const login = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({
          message:
            "Լրացրեք email-ը և գաղտնաբառը",
        });
    }

    const user =
      await User.findOne({
        email:
          email
            .trim()
            .toLowerCase(),
      });

    if (!user) {
      return res
        .status(400)
        .json({
          message:
            "Email-ը կամ գաղտնաբառը սխալ է",
        });
    }

    const passwordIsCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordIsCorrect) {
      return res
        .status(400)
        .json({
          message:
            "Email-ը կամ գաղտնաբառը սխալ է",
        });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({
          message:
            "Խնդրում ենք հաստատել ձեր email-ը",
        });
    }

    const token =
      jwt.sign(
        {
          userId: user._id,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "7d",
        }
      );

    return res.json({
      message:
        "Մուտքը հաջողվեց",

      token,

      user: {
        id: user._id,

        name:
          user.name,

        surname:
          user.surname,

        email:
          user.email,

        avatar:
          user.avatar,

        phone:
          user.phone,

        city:
          user.city,
      },
    });
  } catch (error) {
    console.log(
      "Login error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Server error",
      });
  }
};


// ======================================================
// GET ME
// ======================================================

export const getMe = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.userId
      ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Օգտատերը չի գտնվել",
        });
    }

    return res.json({
      user,
    });
  } catch (error) {
    console.log(
      "Get me error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Server error",
      });
  }
};


// ======================================================
// UPDATE MY PROFILE
// ======================================================

export const updateMyProfile =
  async (req, res) => {
    try {
      const {
        name,
        surname,
        phone,
        city,
        address,
        birthDate,
        bio,
      } = req.body;

      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Օգտատերը չի գտնվել",
          });
      }


      // NAME

      if (name !== undefined) {
        const cleanName =
          String(name).trim();

        if (!cleanName) {
          return res
            .status(400)
            .json({
              message:
                "Անունը չի կարող դատարկ լինել",
            });
        }

        user.name =
          cleanName;
      }


      // SURNAME

      if (
        surname !== undefined
      ) {
        const cleanSurname =
          String(
            surname
          ).trim();

        if (!cleanSurname) {
          return res
            .status(400)
            .json({
              message:
                "Ազգանունը չի կարող դատարկ լինել",
            });
        }

        user.surname =
          cleanSurname;
      }


      // PHONE

      if (
        phone !== undefined
      ) {
        user.phone =
          String(
            phone
          ).trim();
      }


      // CITY

      if (
        city !== undefined
      ) {
        user.city =
          String(
            city
          ).trim();
      }


      // ADDRESS

      if (
        address !== undefined
      ) {
        user.address =
          String(
            address
          ).trim();
      }


      // BIO

      if (bio !== undefined) {
        const cleanBio =
          String(bio).trim();

        if (
          cleanBio.length >
          300
        ) {
          return res
            .status(400)
            .json({
              message:
                "Իմ մասին դաշտը չի կարող գերազանցել 300 նիշը",
            });
        }

        user.bio =
          cleanBio;
      }


      // BIRTHDATE

      if (
        birthDate !==
        undefined
      ) {
        if (!birthDate) {
          user.birthDate =
            null;
        } else {
          const parsedDate =
            new Date(
              birthDate
            );

          if (
            Number.isNaN(
              parsedDate.getTime()
            )
          ) {
            return res
              .status(400)
              .json({
                message:
                  "Ծննդյան ամսաթիվը սխալ է",
              });
          }

          if (
            parsedDate >
            new Date()
          ) {
            return res
              .status(400)
              .json({
                message:
                  "Ծննդյան ամսաթիվը չի կարող լինել ապագայում",
              });
          }

          user.birthDate =
            parsedDate;
        }
      }


      await user.save();


      const updatedUser =
        await User.findById(
          req.userId
        ).select(
          "-password"
        );


      return res.json({
        message:
          "Պրոֆիլը հաջողությամբ թարմացվեց",

        user:
          updatedUser,
      });
    } catch (error) {
      console.log(
        "Update profile error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Չհաջողվեց թարմացնել պրոֆիլը",
        });
    }
  };


// ======================================================
// UPLOAD AVATAR
// ======================================================

export const uploadMyAvatar =
  async (req, res) => {
    try {
      console.log(
        "FILE:",
        req.file
      );

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "Ընտրեք նկար",
          });
      }

      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        if (
          req.file.path &&
          fs.existsSync(
            req.file.path
          )
        ) {
          fs.unlinkSync(
            req.file.path
          );
        }

        return res
          .status(404)
          .json({
            message:
              "Օգտատերը չի գտնվել",
          });
      }


      // =========================
      // DELETE OLD AVATAR
      // =========================

      const oldAvatarUrl =
        user.avatar?.url;

      if (
        oldAvatarUrl &&
        oldAvatarUrl.startsWith(
          "/upload/avatars/"
        )
      ) {
        const oldAvatarPath =
          path.join(
            process.cwd(),
            oldAvatarUrl.replace(
              /^\/+/,
              ""
            )
          );

        if (
          fs.existsSync(
            oldAvatarPath
          )
        ) {
          fs.unlinkSync(
            oldAvatarPath
          );
        }
      }


      // =========================
      // SAVE NEW AVATAR
      // =========================

      user.avatar = {
        url:
          `/upload/avatars/${req.file.filename}`,
      };

      await user.save();


      return res.json({
        message:
          "Պրոֆիլի նկարը հաջողությամբ փոխվեց",

        avatar:
          user.avatar,
      });

    } catch (error) {
      console.log(
        "Upload avatar error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Չհաջողվեց ներբեռնել նկարը",
        });
    }
  };


// ======================================================
// DELETE AVATAR
// ======================================================

export const deleteMyAvatar =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Օգտատերը չի գտնվել",
          });
      }

      const avatarUrl =
        user.avatar?.url;

      if (
        avatarUrl &&
        avatarUrl.startsWith(
          "/upload/avatars/"
        )
      ) {
        const avatarPath =
          path.join(
            process.cwd(),

            avatarUrl.replace(
              /^\/+/,
              ""
            )
          );

        if (
          fs.existsSync(
            avatarPath
          )
        ) {
          try {
            fs.unlinkSync(
              avatarPath
            );
          } catch (error) {
            console.log(
              "Delete avatar file error:",
              error.message
            );
          }
        }
      }


      user.avatar = {
        url: "",
      };

      await user.save();


      return res.json({
        message:
          "Պրոֆիլի նկարը հաջողությամբ ջնջվեց",

        avatar:
          user.avatar,
      });
    } catch (error) {
      console.log(
        "Delete avatar error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Չհաջողվեց ջնջել նկարը",
        });
    }
  };


// ======================================================
// CHANGE PASSWORD
// ======================================================

export const changePassword =
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res
          .status(400)
          .json({
            message:
              "Լրացրեք բոլոր դաշտերը",
          });
      }

      if (
        newPassword.length <
        6
      ) {
        return res
          .status(400)
          .json({
            message:
              "Նոր գաղտնաբառը պետք է լինի առնվազն 6 նիշ",
          });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            message:
              "Նոր գաղտնաբառերը չեն համընկնում",
          });
      }


      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Օգտատերը չի գտնվել",
          });
      }


      const isCorrectPassword =
        await bcrypt.compare(
          currentPassword,
          user.password
        );


      if (
        !isCorrectPassword
      ) {
        return res
          .status(400)
          .json({
            message:
              "Հին գաղտնաբառը սխալ է",
          });
      }


      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );


      if (samePassword) {
        return res
          .status(400)
          .json({
            message:
              "Նոր գաղտնաբառը պետք է տարբերվի հինից",
          });
      }


      user.password =
        await bcrypt.hash(
          newPassword,
          10
        );

      await user.save();


      return res.json({
        message:
          "Գաղտնաբառը հաջողությամբ փոխվեց",
      });
    } catch (error) {
      console.log(
        "Change password error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };


// ======================================================
// GET ALL USERS
// ======================================================

export const getUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find()
        .select(
          "name surname email avatar phone city address birthDate bio isVerified createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.json(
      users
    );
  } catch (error) {
    console.log(
      "Get users error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Չհաջողվեց ստանալ օգտատերերին",
      });
  }
};


// ======================================================
// GET USER DETAILS FOR ADMIN
// ======================================================

export const getUserDetails =
  async (req, res) => {
    try {
      const { userId } =
        req.params;


      const user =
        await User.findById(
          userId
        )
          .select(
            "-password"
          )
          .lean();


      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Օգտատերը չի գտնվել",
          });
      }


      // ORDERS

      const orders =
        await Order.find({
          $or: [
            {
              user: userId,
            },

            ...(user.email
              ? [
                  {
                    "customer.email":
                      user.email,
                  },
                ]
              : []),
          ],
        })
          .populate(
            "items.product",
            "title image price category categorySlug"
          )
          .sort({
            createdAt: -1,
          })
          .lean();


      // COMMENTS

      const comments =
        await Comment.find({
          user: userId,
        })
          .populate(
            "product",
            "title image price category categorySlug"
          )
          .sort({
            createdAt: -1,
          })
          .lean();


      // TOTAL SPENT

      const totalSpent =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(
              order.totalPrice ||
                0
            ),

          0
        );


      // TOTAL PRODUCTS

      const totalProducts =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            (
              order.items || []
            ).reduce(
              (
                itemTotal,
                item
              ) =>
                itemTotal +
                Number(
                  item.quantity ||
                    1
                ),

              0
            ),

          0
        );


      const lastOrder =
        orders.length > 0
          ? orders[0]
          : null;


      return res.json({
        user,

        stats: {
          ordersCount:
            orders.length,

          commentsCount:
            comments.length,

          totalSpent,

          totalProducts,

          lastOrderAt:
            lastOrder
              ?.createdAt ||
            null,
        },

        orders,

        comments,
      });
    } catch (error) {
      console.log(
        "Get user details error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Չհաջողվեց ստանալ կլիենտի տվյալները",
        });
    }
  };


// ======================================================
// GET MY DETAILS
// ======================================================

export const getMyDetails =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.userId
        )
          .select(
            "-password"
          )
          .lean();


      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Օգտատերը չի գտնվել",
          });
      }


      // ORDERS

      const orders =
        await Order.find({
          $or: [
            {
              user:
                req.userId,
            },

            ...(user.email
              ? [
                  {
                    "customer.email":
                      user.email,
                  },
                ]
              : []),
          ],
        })
          .populate(
            "items.product",
            "title image price category categorySlug"
          )
          .sort({
            createdAt: -1,
          })
          .lean();


      // COMMENTS

      const comments =
        await Comment.find({
          user:
            req.userId,
        })
          .populate(
            "product",
            "title image price category categorySlug"
          )
          .sort({
            createdAt: -1,
          })
          .lean();


      // TOTAL SPENT

      const totalSpent =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(
              order.totalPrice ||
                0
            ),

          0
        );


      // TOTAL PRODUCTS

      const totalProducts =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            (
              order.items || []
            ).reduce(
              (
                sum,
                item
              ) =>
                sum +
                Number(
                  item.quantity ||
                    1
                ),

              0
            ),

          0
        );


      const lastOrder =
        orders.length > 0
          ? orders[0]
          : null;


      return res.json({
        user,

        stats: {
          ordersCount:
            orders.length,

          commentsCount:
            comments.length,

          totalSpent,

          totalProducts,

          lastOrderAt:
            lastOrder
              ?.createdAt ||
            null,
        },

        orders,

        comments,
      });
    } catch (error) {
      console.log(
        "Get my details error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Չհաջողվեց ստանալ տվյալները",
        });
    }
  };

  // =====================================
// FORGOT PASSWORD
// =====================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Մուտքագրեք ձեր email-ը",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    // Անվտանգության համար նույն պատասխանն ենք տալիս
    // անկախ նրանից՝ email-ը գոյություն ունի, թե ոչ։

    if (!user) {
      return res.json({
        message:
          "Եթե այս email-ը գրանցված է, կստանաք վերականգնման հղում",
      });
    }

    // Ստեղծում ենք պատահական token

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Պահպանում ենք token-ի hash-ը

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Հղումը ուժի մեջ է 15 րոպե

    user.resetPasswordExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink =
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,

      subject: "FurniHome - Գաղտնաբառի վերականգնում",

      html: `
        <div style="font-family: Arial; padding: 25px;">
          <h2>FurniHome</h2>

          <h3>Գաղտնաբառի վերականգնում</h3>

          <p>
            Դուք հարցում եք ուղարկել գաղտնաբառը վերականգնելու համար։
          </p>

          <p>
            Սեղմեք ներքևի կոճակը՝ նոր գաղտնաբառ ստեղծելու համար։
          </p>

          <a
            href="${resetLink}"
            style="
              display: inline-block;
              padding: 12px 25px;
              background: #a2784d;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Վերականգնել գաղտնաբառը
          </a>

          <p>
            Հղումը գործում է 15 րոպե։
          </p>

          <p>
            Եթե դուք չեք կատարել այս հարցումը,
            կարող եք անտեսել նամակը։
          </p>
        </div>
      `,
    });

    return res.json({
      message:
        "Եթե այս email-ը գրանցված է, կստանաք վերականգնման հղում",
    });

  } catch (error) {
    console.log("Forgot password error:", error);

    return res.status(500).json({
      message: "Չհաջողվեց ուղարկել նամակը",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: "Լրացրեք երկու դաշտերը",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Գաղտնաբառը պետք է պարունակի առնվազն 6 նիշ",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Գաղտնաբառերը չեն համընկնում",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Հղումը սխալ է կամ ժամկետանց",
      });
    }

    user.password = await bcrypt.hash(
      password,
      10
    );

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      message: "Գաղտնաբառը հաջողությամբ փոխվել է։",
    });
  } catch (error) {
    console.log(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      message: "Չհաջողվեց փոխել գաղտնաբառը",
    });
  }
};

