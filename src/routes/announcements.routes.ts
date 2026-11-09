import { Router } from "express";
import * as announcementsController from "../controllers/announcements.controller.ts";
import authenticate from "../middleware/authenticate.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import {
  AnnouncementParamsSchema,
  CreateAnnouncementSchema,
  GetAnnouncementsQuerySchema,
  UpdateAnnouncementSchema,
} from "../validators/announcements.validator.ts";

const router = Router();

router.get(
  "/",
  validateQuery(GetAnnouncementsQuerySchema),
  announcementsController.getAll,
);
router.post(
  "/",
  authenticate,
  validateBody(CreateAnnouncementSchema),
  announcementsController.create,
);
router.get(
  "/:id",
  validateParams(AnnouncementParamsSchema),
  announcementsController.getById,
);
router.patch(
  "/:id",
  authenticate,
  validateParams(AnnouncementParamsSchema),
  validateBody(UpdateAnnouncementSchema),
  announcementsController.update,
);
router.delete(
  "/:id",
  authenticate,
  validateParams(AnnouncementParamsSchema),
  announcementsController.deleteItem,
);

export default router;
