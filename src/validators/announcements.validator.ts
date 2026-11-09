import z from "zod";
import { registry } from "../openapi.ts";

export const GetAnnouncementsQuerySchema = registry.register(
  "getAnnouncementsQuery",
  z.object({
    page: z.coerce.number().int().min(1).optional(),
    sort: z.enum(["newest", "oldest"]).optional(),
    search: z.string().max(100).optional(),
  }),
);
export const AnnouncementParamsSchema = registry.register(
  "AnnouncementParams",
  z.object({
    id: z.coerce.number().int().positive(),
  }),
);

const announcementPayload = {
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.coerce.number().int().min(0),
  category: z.enum(["sale", "service", "job", "other"]),
};
export const CreateAnnouncementSchema = registry.register(
  "CreateAnnouncement",
  z.object(announcementPayload),
);
export const UpdateAnnouncementSchema = registry.register(
  "UpdateAnnouncement",
  z.object(announcementPayload).partial(),
);

export type getAnnouncementsQuery = z.infer<typeof GetAnnouncementsQuerySchema>;
export type AnnouncementParams = z.infer<typeof AnnouncementParamsSchema>;
export type CreateAnnouncement = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncement = z.infer<typeof UpdateAnnouncementSchema>;

registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Get all announcements with pagination, filtering and sorting",
  request: {
    query: GetAnnouncementsQuerySchema,
  },
  responses: {
    200: { description: "List of announcements with pagination metadata" },
  },
});

registry.registerPath({
  method: "post",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Create announcement",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "multipart/form-data": { schema: CreateAnnouncementSchema.extend({
        image: z.string().optional().openapi({ type: "string", format: "binary" }),
      }) } },
    },
  },
  responses: {
    201: { description: "Announcement created successfully" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Get announcement by ID",
  request: {
    params: AnnouncementParamsSchema,
  },
  responses: {
    200: { description: "Announcement retrieved successfully" },
    404: { description: "Announcement not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Update announcement by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: AnnouncementParamsSchema,
    body: {
      content: { "multipart/form-data": { schema: UpdateAnnouncementSchema.extend({
        image: z.string().optional().openapi({ type: "string", format: "binary" }),
      }) } },
    },
  },
  responses: {
    200: { description: "Announcement updated successfully" },
    403: { description: "Access denied" },
    404: { description: "Announcement not found" },
    422: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Delete announcement by ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: AnnouncementParamsSchema,
  },
  responses: {
    204: { description: "Announcement deleted successfully" },
    403: { description: "Access denied" },
    404: { description: "Announcement not found" },
  },
});
