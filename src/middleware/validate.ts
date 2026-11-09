import { z } from "zod";
import createHttpError from "http-errors";
import type { Request, Response, NextFunction } from "express";

export const validateBody =
  <T extends z.ZodType>(schema: T) =>
  (req: Request<{}, {}, z.infer<T>>, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      req.log.warn("Validation failed");
      const flattened = z.flattenError(result.error);
      return next(createHttpError(422, "Validation failed", {
        details: Object.keys(flattened.fieldErrors).length > 0
          ? flattened.fieldErrors
          : flattened.formErrors,
      }));
    }
    req.body = result.data;
    next();
  };

export const validateParams =
  <T extends z.ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      req.log.warn("Invalid parameters");

      return next(createHttpError(400, "Invalid parameters", {
        details: z.flattenError(result.error).fieldErrors,
      }));
    }

    res.locals.params = result.data;
    next();
  };

export const validateQuery =
  <T extends z.ZodType>(schema: T) =>
  (
    req: Request,
    res: Response<any, { query: z.infer<T> }>,
    next: NextFunction,
  ) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      req.log.warn("Invalid query parameters");
      return res.status(400).json({
        error: "Invalid query parameters",
        details: z.flattenError(result.error).fieldErrors,
      });
    }
    res.locals.query = result.data;
    next();
  };
