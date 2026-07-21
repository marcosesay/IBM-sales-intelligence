import { Router, type IRouter } from "express";
import healthRouter from "./health";
import briefingRouter from "./briefing";
import prospectRouter from "./prospect";
import historyRouter from "./history";
import chatRouter from "./chat";
import architectureRouter from "./architecture";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/briefing", briefingRouter);
router.use("/prospect", prospectRouter);
router.use("/history", historyRouter);
router.use("/chat", chatRouter);
router.use("/architecture", architectureRouter);

export default router;
