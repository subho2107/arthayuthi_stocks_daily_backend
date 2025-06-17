import { Request, Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { Watchlist } from "../models/Watchlist";
import { User } from "../models/User";
import { config } from "../environment/config";
import redis from "../config/redis";
import { StockDetails } from "../types/stocks";
import moment from "moment";

const baseUrl = config.alphaVantage.baseUrl;
const apiKey = config.alphaVantage.apiKey;

const logoBaseUrl = config.apiNinjaLogo.baseUrl;
const logoApiKey = config.apiNinjaLogo.apiKey;

export const addToWatchlist = async (req: Request, res: Response): Promise<any> => {
    const { stockSymbol, stockName } = req.body;
    if (!stockSymbol) {
        return res.status(200).json({ message: "Please provide stock symbol", error: true });
    }
    if (!stockName) {
        return res.status(200).json({ message: "Please provide stock name", error: true });
    }
    try {
        const userId = (req as CustomRequest).decoded.userId;
        if (!userId) {
            return res.status(401).json({ message: "Token expired. Please login again", error: true });
        }

        const user = await User.findById(userId).lean().exec();
        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        const stockAddedAlready = await Watchlist.findOne({ userId, stockSymbol }).lean().exec();
        if (stockAddedAlready) {
            return res.status(200).json({ message: "Stock already in watchlist", error: true });
        }

        const newWatchlistItem = new Watchlist({ userId, stockSymbol, stockName });
        const watchlistAddResponse = await newWatchlistItem.save();
        if (!watchlistAddResponse) {
            return res.status(200).json({ message: "Something went wrong while adding to watchlist", error: true });
        }
        return res.status(200).json({ message: "Stock added to watchlist", error: false });
    } catch (error) {
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

        const watchlistItem = await Watchlist.findOneAndDelete({ userId, stockSymbol }).lean().exec();
        if (!watchlistItem) {
            return res.status(200).json({ message: "Stock not found in watchlist", error: true });
        }

        return res.status(200).json({ message: "Stock removed from watchlist", error: false });
    } catch (error) {
        console.log("Something went wrong while removing from watchlist", error);
        return res.status(500).json({ message: "Something went wrong", error: true });
    }
}

export const searchForStock = async (req: Request, res: Response): Promise<any> => {
    const { searchQuery } = req.body;
    if (!searchQuery) {
        return res.status(200).json({ message: "Please provide search", error: true });
    }
    try {
        const url = `${baseUrl}?function=SYMBOL_SEARCH&keywords=${searchQuery}&apikey=${apiKey}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "request",
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            return res.status(200).json({ message: "Error fetching stock data", error: true });
        }
        const data = await response.json();
        console.log(data);
        let formattedResponse = data["bestMatches"]?.map((stock: any) => {
            return {
                symbol: stock["1. symbol"],
                name: stock["2. name"],
            };
        });

        return res.status(200).json({ data: formattedResponse || [], error: false });

    } catch (error) {
        console.log("Something went wrong while searching for stock", error);
        return res.status(500).json({ message: "Something went wrong", error: true });
    }
}

export const getStockDetails = async (req: Request, res: Response): Promise<any> => {

    try {
        const { stockSymbol } = req.body;
        const userId = (req as CustomRequest).decoded.userId;
        if (!userId) {
            return res.status(401).json({ message: "Token expired. Please login again", error: true });
        }
        console.log("Stock Symbol", stockSymbol);
        if (!stockSymbol) {
            return res.status(200).json({ message: "Please provide stock symbol", error: true });
        }
        const cacheKey = `stock:${stockSymbol}`;
        // const cachedStocksData = await redis.get(cacheKey);
        // if (cachedStocksData) {
        //     console.log("Cache hit for stock details", cachedStocksData);
        //     return res.status(200).json({ data: JSON.parse(cachedStocksData), error: false });
        // }

        const stockDetailsResponse = await getStockTrendAndPrice(stockSymbol);
        const isInWatchlist = await Watchlist.findOne({ userId, symbol: stockSymbol }).lean().exec();
        console.log({...stockDetailsResponse.data, isInWatchlist: !!isInWatchlist})
        if (stockDetailsResponse.error) {
            return res.status(200).json({ message: stockDetailsResponse.message, error: true });
        } else {
            await redis.set(cacheKey, JSON.stringify(stockDetailsResponse.data), "EX", 60 * 60);
            return res.status(200).json({ data: {...stockDetailsResponse.data, isInWatchlist: !!isInWatchlist}, error: false });
        }

    } catch (error) {
        console.log("Something went wrong while fetching stock details", error);
        return res.status(500).json({ message: "Something went wrong", error: true });
    }

}

const getStockTrendAndPrice = async (stockSymbol: string): Promise<{ error: boolean, message?: string, data?: StockDetails }> => {
    const url = `${baseUrl}?function=TIME_SERIES_DAILY&symbol=${stockSymbol}&outputsize=compact&apikey=${apiKey}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "User-Agent": "request",
            "Accept": "application/json",
        },
    });
    if (!response.ok) {
        return { message: "Error fetching stock data", error: true };
    }
    const data = await response.json();
    console.log("Stock Data", data);
    const dailyStocksPrices = Object.entries(data["Time Series (Daily)"]);
    if (!dailyStocksPrices || dailyStocksPrices.length === 0) {
        return { message: "No stock data found", error: true };
    }
    const trendData = dailyStocksPrices.slice(0, Math.min(7, dailyStocksPrices.length)).map(([key, value]) => {
        return {
            label: moment(key).format("MMM Do"),
            value: Number((value as any)["4. close"]),
        };
    });
    console.log("Trend Data", trendData);
    const currentPrice = trendData[0]?.value;
    let percentChange = "0", change = 0;
    let overallPercentChange = "0", overallChange = 0;
    if (trendData.length > 1) {
        const previousPrice = trendData[1]?.value;
        console.log(currentPrice, previousPrice);
        change = (currentPrice - previousPrice);
        console.log("Change", change);
        percentChange = ((Math.abs(change) / Number(previousPrice)) * 100).toFixed(2);

        console.log(currentPrice, trendData[trendData.length - 1].value);
        overallChange = (currentPrice - trendData[trendData.length - 1].value);
        console.log("Overall Change", overallChange);

        overallPercentChange = ((Math.abs(overallChange) / Number(trendData[trendData.length - 1].value)) * 100).toFixed(2);

    }
    console.log(trendData);
    return {
        error: false,
        data: {
            stockSymbol,
            currentPrice: currentPrice.toFixed(2),
            percentChange,
            trendData,
            increased: change > 0,
            overallPercentChange,
            overallIncreased: overallChange > 0,
        }
    };
}
