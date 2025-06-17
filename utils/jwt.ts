import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateToken = (payload: object, expiresIn = "1d") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
