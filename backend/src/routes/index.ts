import { Router, type IRouter } from "express";
import healthRouter from "./health";
import briefingRouter from "./briefing";
import prospectRouter from "./prospect";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/briefing", briefingRouter);
router.use("/prospect", prospectRouter);

export default router;
