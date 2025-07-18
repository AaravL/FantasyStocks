#TODO: WHAT ABOUT HOLIDAYS!!!!! Probably retrieve from alpaca and store for every other case. 

from datetime import datetime, timedelta, timezone as tz

TIME_CHUNK_SIZE = 5

"""
Converts date to previous Friday if Sat/Sun. Expects UTC
"""
def adjust_for_weekend(time: datetime) -> datetime: 
    if time.weekday() == 5: 
        return (time - timedelta(days = 1)).replace(hour=23, minute=59)
    elif time.weekday() == 6: 
        return (time - timedelta(days = 2)).replace(hour=23, minute=59)
    return time

"""
Clips down time to a valid trading hours time. Expects UTC
"""
def clip_to_trading_hours(time: datetime) -> datetime: 
    time = adjust_for_weekend(time)
    
    # Start by accounting for behind opening time. Watch out for Mondays. 
    open_time = time.replace(hour=14, minute=30)    
    if time < open_time and time.weekday() == 0:
        time = (time - timedelta(days = 3)).replace(hour=23, minute=59)
    elif time < open_time: 
        time = (time - timedelta(days = 1)).replace(hour=23, minute=59)
    
    # Then account for the closing time
    close_time = time.replace(hour=21, minute=0)
    if time > close_time: 
        return close_time
    return time

"""
Rounds time to nearest time point that rests on boundary of a time chunk specified by TIME_CHUNK_SIZE
"""
def round_to_time_point(time: datetime) -> datetime: 
    chunk_minute = time.minute - (time.minute % TIME_CHUNK_SIZE)
    return time.replace(minute = chunk_minute)

"""
This function takes in the current time and processes it to get a valid trading time point to query
"""
def process_time(now: datetime) -> datetime: 
    now = now.astimezone(tz.utc).replace(second = 0, microsecond = 0)
    now = clip_to_trading_hours(now)
    now = round_to_time_point(now)
    
    return now