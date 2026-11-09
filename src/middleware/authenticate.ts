import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}

const authenticate = <P>(
  req: Request<P>,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.log.warn("Token not provided");
    return res.status(401).json({ error: "Token not provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (
      typeof decoded === "string" ||
      decoded.type !== "access" ||
      !/^[1-9]\d*$/.test(decoded.sub ?? "")
    ) {
      req.log.warn("Invalid or expired token");
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = decoded as jwt.JwtPayload;
    next();
  } catch (error) {
    req.log.warn("Invalid or expired token");
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authenticate;
