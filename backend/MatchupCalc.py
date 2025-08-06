from fastapi import FastAPI
from fastapi.responses import JSONResponse
import traceback
from datetime import datetime, date
from dotenv import load_dotenv
import os

# Load environment variables early
load_dotenv()

# Now safely read env vars
API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_API_SECRET")

# Your other imports and constants
from config import TIME_CHUNK_SIZE
from database import get_client, retrieve_stock, add_entries
from stocks import fetch_price

app = FastAPI()

def get_current_week(client):
    today = datetime.today()
    response = client.table("matchups").select("created_date").gte("created_date", today).order("created_date", desc = False).limit(1).execute()
    start_date = datetime.fromisoformat(response.data[0]['created_date'])
    print(f"Start date for current week: {start_date}")
    return ((today - start_date).days // 7) + 1

def fetch_unprocessed_matchups(client, end_time):
    today_str = date.today().isoformat()
    week = get_current_week(client)
    response = client.table("matchups").select("*").lte("week", week).neq("created_date", today_str).execute()
    print(f"Fetched {len(response.data)} unprocessed matchups for week {week} ending on {today_str}.")
    return response.data

def weekly_score_calc(client, matchups):
    for matchup in matchups:
        user1_portfolio = client.table("portfolios").select("current_balance", "start_of_week_total").eq("league_member_id", matchup['user1_id']).execute().data[0]
        user2_portfolio = client.table("portfolios").select("current_balance", "start_of_week_total").eq("league_member_id", matchup['user2_id']).execute().data[0]

        user1_score = user1_portfolio["current_balance"]
        user2_score = user2_portfolio["current_balance"]

        user1_start_amount = user1_portfolio["start_of_week_total"]
        user2_start_amount = user2_portfolio["start_of_week_total"]

        user1_stocks = client.table("holdings").select("ticker", "stock_amount").eq("league_member_id", matchup['user1_id']).execute().data
        user2_stocks = client.table("holdings").select("ticker", "stock_amount").eq("league_member_id", matchup['user2_id']).execute().data

        for stock in user1_stocks:
            price = (fetch_price(stock['ticker'], datetime.now()))["vwap"]
            user1_score += price * stock['stock_amount']

        for stock in user2_stocks:
            price = (fetch_price(stock['ticker'], datetime.now()))["vwap"]
            user2_score += price * stock['stock_amount']

        user1_score /= user1_start_amount
        user2_score /= user2_start_amount

        winner = matchup['user1_id'] if user1_score > user2_score else matchup['user2_id']

        response = client.table("matchups").update({
            "winner_id": winner,
            "u1_score": user1_score,
            "u2_score": user2_score
        }).eq("id", matchup['id']).execute()
        print("Update response:", response)
    print("All matchups processed successfully.")
    return True

def run_weekly_matchups():
    client = get_client()
    matchups = fetch_unprocessed_matchups(client, datetime.now())
    
    if not matchups:
        print("No unprocessed matchups found.")
        return False
    
    success = weekly_score_calc(client, matchups)
    
    if success:
        print("Weekly matchups processed successfully.")
    else:
        print("Failed to process weekly matchups.")
    
    return success