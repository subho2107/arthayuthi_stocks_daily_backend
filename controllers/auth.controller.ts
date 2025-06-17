import { Request, Response } from "express";
import { User } from "../models/User";
import { CustomRequest } from "../middleware/auth";
import redis from "../config/redis";
import { generateToken } from "../utils/jwt";
export const registerUser = async (req: Request, res: Response) : Promise<any> => {
  const { name, email, password } = req.body;
  if (!email) {
    return res.status(200).json({ message: "Please provide email", error: true });
  }
  if (!password) {
    return res.status(200).json({ message: "Please provide password", error: true });
  }
  if (!name) {
    return res.status(200).json({ message: "Please provide name", error: true });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(200).json({ message: "Email already exists", error: true });

    const newUser = await User.create({ name, email, password });
    const token = generateToken(
      { userId: newUser._id, email: newUser.email }
    );
    return res.status(200).json({ message: "User registered", token, error: false});
  } catch (err) {
    console.log("Something went wrong while registering user", err);
    return res.status(500).json({ message: "Something went wrong", error: true });
  }
};

export const loginUser = async (req: Request, res: Response):Promise<any> => {
  const { email, password } = req.body;
  if(!email){
    return res.status(200).json({error: true, message: "Please provide email"});
  }
  if(!password){
    return res.status(200).json({error: true, message: "Please provide password"});
  }
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(200).json({ message: "Invalid credentials", error: true });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(200).json({ message: "Invalid credentials", error: true });

    const token = generateToken(
      { userId: user._id, email: user.email }
    );


    return res.status(200).json({ message: "Login successful", token, error: false });
  } catch (err) {
    console.log("Something went wrong while logging in user", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};


export const logoutUser = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    console.log("Logging out user");
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    console.log("Logging out user with token:", token);
    if (token) {
      console.log("Setting token as expired in Redis");
      await redis.set(`expired_${token}`, "1", "EX", 60 * 60 * 24); // expires in 24 hours
    }
    console.log("User logged out successfully");
    return res.status(200).json({ message: "Logged out successfully", error: true });
  } catch (err) {
    console.log("Something went wrong while logging out user", err);
    return res.status(500).json({ message: "Something went wrong", error: true });
  }
};