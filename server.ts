import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";


import { connectDB } from "./config/db";

import authRoutes from "./routes/auth.routes";
import stocksRoutes from "./routes/stocks.routes";



const app = express();
const PORT = process.env.PORT || 4000;
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  
app.use(cors());
// app.use(morgan("dev"));
app.use(express.json());

// Grouped route prefixes
app.use("/auth", authRoutes);
app.use("/stocks", stocksRoutes);

app.get("/ping", (req, res) => {
    res.json({ message: "pong" });
  });
  
connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
});
