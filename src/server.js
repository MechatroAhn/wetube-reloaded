import express from "express";
import morgan from "morgan";
import globalRouter from "./routers/globalRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import req from "express/lib/request";
import res from "express/lib/response";

const PORT = 4000;

const app = express();
const logger = morgan("dev");

app.use(logger);


app.use("/", globalRouter);
app.use("/videos", videoRouter);
app.use("/users", userRouter);




const handleListening=() => console.log(`server listening on port http://localhost:${PORT}`);

app.listen(PORT, handleListening);
