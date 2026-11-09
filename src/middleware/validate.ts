import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validateBody =
  <T extends z.ZodType>(schema: T) =>
  (req: Request<{}, {}, z.infer<T>>, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      req.log.warn("Validation failed");
      const flattened = z.flattenError(result.error);
      return res.status(422).json({
        error: "Validation failed",
        details:
          Object.keys(flattened.fieldErrors).length > 0
            ? flattened.fieldErrors
            : flattened.formErrors,
      });
    }
    req.body = result.data;
    next();
  };

export const validateParams =
  <T extends z.ZodType>(schema: T) =>
  (req: Request<z.infer<T>>, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      req.log.warn("Invalid parameters");
      return res.status(400).json({
        error: "Invalid parameters",
        details: z.flattenError(result.error).fieldErrors,
      });
    }
    req.params = result.data;
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
