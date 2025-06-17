import { Request, Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { Watchlist, WatchlistSchemaInterface } from "../models/Watchlist";
import { User } from "../models/User";
import { config } from "../environment/config";

const baseUrl = config.alphaVantage.baseUrl;
const apiKey = config.alphaVantage.apiKey;

export const addToWatchlist = async (req: Request, res: Response): Promise<any> => {
    const {stockSymbol, stockName} = req.body;
    if(!stockSymbol) {
        return res.status(200).json({ message: "Please provide stock symbol", error: true });
    }
    if(!stockName) {
        return res.status(200).json({ message: "Please provide stock name", error: true });
    }
    try{
        const userId = (req as CustomRequest).decoded.userId;
        if(!userId) {
            return res.status(401).json({ message: "Token expired. Please login again", error: true });
        }

        const user = await User.findById(userId).lean().exec();
        if(!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        const stockAddedAlready = await Watchlist.findOne({ userId, symbol: stockSymbol }).lean().exec();
        if(stockAddedAlready) {
            return res.status(200).json({ message: "Stock already in watchlist", error: true });
        }

        const newWatchlistItem = new Watchlist({ userId, symbol: stockSymbol, name: stockName });
        const watchlistAddResponse = await newWatchlistItem.save();
        if(!watchlistAddResponse) {
            return res.status(200).json({ message: "Something went wrong while adding to watchlist", error: true });
        }
        return res.status(200).json({ message: "Stock added to watchlist", error: false, data:[] });
    }catch(error){
        console.log("Something went wrong while adding to watchlist", error);
        return res.status(500).json({ message: "Something went wrong", error: true });
    }
}

export const removeFromWatchlist = async (req: Request, res: Response): Promise<any> => {
    const { stockSymbol } = req.body;
    if (!stockSymbol) {
        return res.status(200).json({ message: "Please provide stock symbol", error: true });
    }
    try {
        const userId = (req as CustomRequest).decoded.userId;
        if (!userId) {
            return res.status(401).json({ message: "Token expired. Please login again", error: true });
        }

        const watchlistItem = await Watchlist.findOneAndDelete({ userId, symbol:stockSymbol }).lean().exec();
        console.log(watchlistItem, "watchlistItem", userId, stockSymbol);
        if (!watchlistItem) {
            return res.status(200).json({ message: "Stock not found in watchlist", error: true });
        }
        console.log(watchlistItem);

        return res.status(200).json({ message: "Stock removed from watchlist", error: false , data: true});
    } catch (error) {
        console.log("Something went wrong while removing from watchlist", error);
        return res.status(500).json({ message: "Something went wrong", error: true });
    }
}

export const getWatchlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as CustomRequest).decoded.userId;
        if (!userId) {
            return res.status(401).json({ message: "Token expired. Please login again", error: true });
        }

        const watchlistItems = await Watchlist.find({ userId }).lean().exec();
        if (!watchlistItems || watchlistItems.length === 0) {
            return res.status(200).json({ message: "No items in watchlist", error: false, data: [] });
        }
        console.log(watchlistItems)
        const priceAndChangeResponse = await fetchPriceAndChangeForWatchlist(watchlistItems);
        console.log(priceAndChangeResponse, "priceAndChangeResponse");
        return res.status(200).json({ message: "Watchlist retrieved successfully", error: false, data: priceAndChangeResponse?.data });
    } catch (error) {
        console.log("Something went wrong while fetching watchlist", error);
        return res.status(500).json({ message: "Something went wrong", error: true });
    }
}

const fetchPriceAndChangeForWatchlist = async (watchListItems: WatchlistSchemaInterface[]): Promise<{error: boolean, message?: string, data?: any}> => {
    let extraDetailsAddedWatchListItems: any[] = [];
    if(watchListItems.length == 0){
        return { error: false, message: "No items in watchlist", data: [] };
    }
    for(let item of watchListItems){
        try {
            const response = await fetch(`${baseUrl}?function=GLOBAL_QUOTE&symbol=${item.symbol}.BSE&apikey=${apiKey}`);
            if (!response.ok) {
                throw new Error(`Error fetching details for ${item.symbol}`);
            }
            const data = await response.json();
            console.log(data);
            extraDetailsAddedWatchListItems.push({
                ...item,
                price: data["05. price"],
                change: data["10. change percent"]
            });
        } catch(error){
            console.log("Something went wrong in fetchPriceAndChangeForWatchList",error);
            return {error: true, message: "Something went wrong while fetching price and change for watchlist"}
        }
    }
    console.log(extraDetailsAddedWatchListItems);
    return { error: false, data: extraDetailsAddedWatchListItems };
}