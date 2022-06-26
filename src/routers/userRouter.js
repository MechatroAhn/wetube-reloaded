import express from "express";
import {getEdit,
        postEdit,
        logout,
        see,
        startGithubLogin,
        finishGithubLogin,
        startKakaoLogin,
        finishKakaoLogin,
        postChangePassword,
        getChangePassword,} from "../controllers/userController"
import { protectorMiddleware, publicOnlyMiddleware, uploadFiles } from "../middlewares";
const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter.route("/edit").all(protectorMiddleware).get(getEdit).post(uploadFiles.single("avatar"), postEdit);
userRouter.get("/:id([0-9a-f]{24})", see);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);
userRouter.get("/kakao/start", publicOnlyMiddleware, startKakaoLogin);
userRouter.get("/kakao/finish", publicOnlyMiddleware, finishKakaoLogin);
userRouter.route("/change-password").all(protectorMiddleware).get(getChangePassword).post(postChangePassword);
export default userRouter;