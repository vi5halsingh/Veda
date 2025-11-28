const multer = require("multer")

const storage = multer({
   
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 1, // 1MB

    },
    storage: multer.diskStorage({
        destinationL:(req, file , cb)=>{
            cb(null,'uploads/')
        },
        filename:(req, file , cb)=>{
            const uniqueSuffix =  "veda" + Date.now() + '-' + Math.round((Math.random() * 1E9));
            cb(null, uniqueSuffix + file.fieldname)
        }
    })
})

const upload = multer({storage:storage})
module.exports = upload;