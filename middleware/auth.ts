import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import redis from "../config/redis";

export interface CustomRequest extends Request {
  decoded?: any;
}

export const authenticate = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
):Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized", error: true });

    const token = authHeader.split(" ")[1];

    const isExpired = await redis.get(`expired_${token}`);
    if (isExpired)
      return res.status(401).json({ message: "Token has expired. Please login again", error: true });

    const decoded = verifyToken(token);
    req.decoded = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token", error: true });
  }
};
