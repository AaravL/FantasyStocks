from supabase import create_client, Client
import pandas as pd

"""
Get a supabase client
"""
def get_client() -> Client: 
    url = "https://yjuvzwdqgrnxnibfmqnx.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdXZ6d2RxZ3JueG5pYmZtcW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NzM1MDYsImV4cCI6MjA2NjA0OTUwNn0.2GHY9B4lUTol8LYqEU2SxOAbY6utTlHUtirq_ojmAOo"
    client = create_client(url, key)
    
    return client
    
"""
Given the ticker, get all of its previous stock data. If the ticker is not in the database, returns None
Note that the timestamp column is of type pd.Timestamp (NOT STR!)
"""
def retrieve_stock(client: Client, ticker: str) -> pd.DataFrame: 
    response = client.table("stock_prices").select("*").eq("symbol", ticker).execute()
    data =  pd.DataFrame(response.data)
    if data.empty: 
        return None
    
    data["timestamp"] = pd.to_datetime(data['timestamp'], utc=True)
    return data

"""
Given a dataframe, insert all its rows that don't already exist into the database. 
Expects index to be default
"""
def add_entries(client: Client, data: pd.DataFrame):
    data = data.copy(deep = False)
    data["timestamp"] = data["timestamp"].astype(str)
    records = data.to_dict(orient="records")

    client.table("stock_prices").upsert(
        records,
        on_conflict="symbol, timestamp",
        ignore_duplicates=True
    ).execute()
    
"""
Delete all entries for stock table
"""
def nuke_stock_table(client: Client): 
    client.table("stock_prices").delete().neq("symbol", "").execute()