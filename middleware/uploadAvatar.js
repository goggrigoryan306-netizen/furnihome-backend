import multer from "multer";
import path from "path";
import fs from "fs";


// ======================================================
// UPLOAD FOLDER
// ======================================================

const uploadDir = path.join(
  process.cwd(),
  "upload",
  "avatars"
);


// եթե upload/avatars գոյություն չունի՝ ստեղծում ենք
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}


// ======================================================
// STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    cb
  ) => {
    cb(null, uploadDir);
  },

  filename: (
    req,
    file,
    cb
  ) => {
    const extension =
      path.extname(
        file.originalname
      );

    const uniqueName =
      `avatar-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(
      null,
      uniqueName
    );
  },
});


// ======================================================
// FILE FILTER
// ======================================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Թույլատրվում են միայն JPG, PNG և WEBP նկարներ"
      ),
      false
    );
  }
};


// ======================================================
// MULTER
// ======================================================

const uploadAvatar = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});

export default uploadAvatar;