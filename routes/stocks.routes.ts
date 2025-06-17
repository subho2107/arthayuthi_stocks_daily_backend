import express from "express";
import { getStockDetails, searchForStock } from "../controllers/stocks.controller";
import {addToWatchlist, getWatchlist, removeFromWatchlist} from "../controllers/watchlist.controller";
import { authenticate } from "../middleware/auth";


const router = express.Router();

router.post("/search", authenticate, searchForStock);
router.post("/details", authenticate, getStockDetails);


router.post("/addToWatchlist", authenticate, addToWatchlist);
router.post("/removeFromWatchlist", authenticate, removeFromWatchlist);
router.post("/watchlist", authenticate, getWatchlist);

export default router;
