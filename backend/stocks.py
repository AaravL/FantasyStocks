from time_utils import process_time
from datetime import datetime, timedelta

from dotenv import load_dotenv
import os

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame

# Load environment variables from .env file
load_dotenv()

# Access them
API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_API_SECRET")

"""
Given a ticker symbol and the current time, get the stock price from the most recent time chunk point 
Currently uses yfinance but we can think about switching to Alpaca for more stability / options but limited API calls
"""
def fetch_price(ticker: str, ts: datetime) -> float: 
    client = StockHistoricalDataClient(API_KEY, API_SECRET)
    use_time = process_time(ts)

    request_params = StockBarsRequest(
        symbol_or_symbols=[ticker],
        start= use_time - timedelta(hours = 24),
        end= use_time,
        timeframe=TimeFrame.Minute
    )

    bars = client.get_stock_bars(request_params)

    if ticker in bars.data: 
        return bars[ticker][-1].model_dump() # dict object with keys: ['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume', 'trade_count', 'vwap']
    else: 
        raise ValueError(f"No price data found for ticker '{ticker}'.")

    

