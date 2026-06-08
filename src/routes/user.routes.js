import {Router} from "express"
import { refreshAccesstoken, registeruser } from "../controllers/user.controller.js";
const router = Router()
import { upload } from "../middlewares/multer.middleware.js";
import {
    loginuser,
    logoutuser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.midlleware.js";
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name : "coverimage",
            maxCount:1
        }
    ]),
    registeruser
)
//router.route("/login").post(login)\



router.route("/login").post(loginuser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutuser)

router.route("/refresh-token").post(refreshAccesstoken)

export default router