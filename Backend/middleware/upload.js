const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/misc';
    if (file.fieldname === 'poster' || file.fieldname === 'backdrop') folder = 'uploads/images';
    else if (file.fieldname.startsWith('video')) folder = 'uploads/videos';
    else if (file.fieldname === 'avatar') folder = 'uploads/avatars';
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|webp/;
  const videoTypes = /mp4|mkv|avi|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (file.fieldname === 'poster' || file.fieldname === 'backdrop' || file.fieldname === 'avatar') {
    if (imageTypes.test(ext)) return cb(null, true);
    return cb(new Error('Only image files allowed'));
  }
  if (file.fieldname.startsWith('video')) {
    if (videoTypes.test(ext)) return cb(null, true);
    return cb(new Error('Only video files allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 4 * 1024 * 1024 * 1024 } });

module.exports = upload;