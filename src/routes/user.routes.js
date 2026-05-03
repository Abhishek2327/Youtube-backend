import {Router} from "express"
import { registeruser } from "../controllers/user.controller.js";
const router = Router()
import { upload } from "../middlewares/multer.middleware.js";

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

export default router