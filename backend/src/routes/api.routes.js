import { Router } from "express";

export function createApiRouter(gameplayService) {
  const router = Router();

  router.get("/health", (req, res) => {
    res.status(200).json({
      data: { status: "ok", service: "lets-talk-api" },
      meta: { requestId: req.requestId }
    });
  });

  router.get("/topics", async (req, res) => {
    const data = await gameplayService.listTopics();
    res.status(200).json({ data, meta: { requestId: req.requestId } });
  });

  router.get("/topics/:topicCode/catalog", async (req, res) => {
    const data = await gameplayService.getCatalog(req.params.topicCode);
    res.status(200).json({ data, meta: { requestId: req.requestId } });
  });

  router.post("/gameplay/next-activity", async (req, res) => {
    const data = await gameplayService.nextActivity(req.body);
    res.status(200).json({ data, meta: { requestId: req.requestId } });
  });

  router.post("/gameplay/resolve-fate", async (req, res) => {
    const data = await gameplayService.resolveFate(req.body);
    res.status(200).json({ data, meta: { requestId: req.requestId } });
  });

  router.post("/gameplay/question-zone/next", async (req, res) => {
    const data = await gameplayService.nextQuestionZone(req.body);
    res.status(200).json({ data, meta: { requestId: req.requestId } });
  });

  return router;
}
