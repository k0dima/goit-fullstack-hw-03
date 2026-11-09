import type { Request, Response } from "express";
import createHttpError from "http-errors";

import prisma from "../../prisma/client.ts";

import type {
  AnnouncementParams,
  CreateAnnouncement,
  getAnnouncementsQuery,
  UpdateAnnouncement,
} from "../validators/announcements.validator.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

const safeUserSelectInput = {
  id: true,
  username: true,
  email: true,
  name: true,
};

export const getAll = async (
  req: Request,
  res: Response<any, { query: getAnnouncementsQuery }>,
) => {
  const { page = 1, sort, search } = res.locals.query;
  const take = 10;
  const skip = (page - 1) * take;
  const where: Prisma.AnnouncementWhereInput = {};

  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  const orderBy: Prisma.AnnouncementOrderByWithRelationInput = {
    createdAt: sort === "oldest" ? "asc" : "desc",
  };

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: {
          select: safeUserSelectInput,
        },
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  res.status(200).json({
    data: announcements,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / take),
      perPage: take,
    },
  });
};

export const create = async (
  req: Request<{}, {}, CreateAnnouncement>,
  res: Response,
) => {
  const { title, description, price, category } = req.body;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      description,
      price,
      category,
      user: {
        connect: { id: Number(req.user!.sub) },
      },
    },
    include: { user: { select: safeUserSelectInput } },
  });

  res.status(201).json(announcement);
};

export const getById = async (
  req: Request<AnnouncementParams>,
  res: Response,
) => {
  const { id } = req.params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      user: {
        select: safeUserSelectInput,
      },
    },
  });

  if (!announcement) {
    throw createHttpError(404, "Announcement not found");
  }

  res.status(200).json(announcement);
};

export const update = async (
  req: Request<AnnouncementParams, {}, UpdateAnnouncement>,
  res: Response,
) => {
  const { id } = req.params;

  const { title, description, price, category } = req.body;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      user: {
        select: safeUserSelectInput,
      },
    },
  });

  if (!announcement) {
    throw createHttpError(404, "Announcement not found");
  }

  if (announcement.user.id !== Number(req.user!.sub)) {
    throw createHttpError(403, "Access denied");
  }

  const updatedAnnouncement = await prisma.announcement.update({
    where: { id },
    data: {
      title,
      description,
      price,
      category,
    },
    include: {
      user: {
        select: safeUserSelectInput,
      },
    },
  });

  res.status(200).json(updatedAnnouncement);
};

export const deleteItem = async (
  req: Request<AnnouncementParams>,
  res: Response,
) => {
  const { id } = req.params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      user: {
        select: safeUserSelectInput,
      },
    },
  });

  if (!announcement) {
    throw createHttpError(404, "Announcement not found");
  }

  if (announcement.user.id !== Number(req.user!.sub)) {
    throw createHttpError(403, "Access denied");
  }

  await prisma.announcement.delete({
    where: { id },
  });

  res.status(204).end();
};
