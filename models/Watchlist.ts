import mongoose, { Schema, Document } from "mongoose";

export interface WatchlistSchemaInterface extends Document {
  userId: string;
  symbol: string;
  name: string;
}

const WatchlistSchema = new Schema<WatchlistSchemaInterface>(
  {
    userId: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);


WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Watchlist = mongoose.model<WatchlistSchemaInterface>("Watchlist", WatchlistSchema);
