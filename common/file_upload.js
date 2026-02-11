const multer = require('multer');

var user_id;

const storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
        cb(null, 'public/upload')
    },
    filename: function (req, file, cb) {

        const mimeExtension = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.jpg',
            'application/octet-stream':'.jpg',
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
            'video/quicktime': '.MOV',
            'video/3gpp': '.3gp',
        };
        cb(null, 'pink-gossip' + '-' + file.originalname.slice(0, 20).replace('.jpg','').replace('.png','').replace('.jpeg','') + ' -' + Date.now() + mimeExtension[file.mimetype])
    }
})


var upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'application/octet-stream' ||
            file.mimetype === 'video/mp4' ||
            file.mimetype === 'video/quicktime' ||
            file.mimetype === 'video/3gpp'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image type, only jpg,jpeg and png are allowed'), false);
        }
    },
  })
  module.exports = upload;