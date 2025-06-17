export interface StockDetails{
    stockSymbol: string;
    currentPrice: string;
    percentChange: string;
    trendData: {
        label: string;
        value: number;
    }[];
    increased: boolean;
    overallPercentChange?: string;
    overallIncreased?: boolean;
}