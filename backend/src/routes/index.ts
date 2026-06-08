import { Router, type IRouter } from "express";
import healthRouter from "./health";
import briefingRouter from "./briefing";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/briefing", briefingRouter);

export default router;
