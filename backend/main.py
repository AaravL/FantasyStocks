from fastapi import FastAPI, HTTPException, Query
from datetime import datetime, timezone as tz
from typing import Optional

from datetime import datetime
from stocks import fetch_price

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Stock price API is running."}

@app.get("/price")
def get_stock_price(ticker: str, ts: Optional[str] = None):
    try:
        if ts:
            dt = datetime.fromisoformat(ts)
        else:
            dt = datetime.now(tz.utc)

        price_data = fetch_price(ticker, dt)
        return {"price_data": price_data}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

