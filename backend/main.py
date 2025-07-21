from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone as tz
from typing import Optional

from datetime import datetime
from stocks import fetch_price

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # set this to "*" if not working to allow all. BUT we should block this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Stock price API is running."}

@app.get("/price")
def get_stock_price(ticker: str, ts: Optional[str] = None):
    try:
        ticker = ticker.upper()
        if ts:
            dt = datetime.fromisoformat(ts)
        else:
            dt = datetime.now(tz.utc)

        price_data = fetch_price(ticker, dt)
        return {"price_data": price_data}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

