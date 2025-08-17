from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from typing import List, Set, Dict

from websocket import ConnectionManager, UserContextConnectionManager
from time_utils import get_now_iso


router = APIRouter(prefix="/draft", tags=["draft"])

manager = UserContextConnectionManager()
active_drafts: Dict[str, asyncio.Task] = {}

async def run_draft(league_id: str): 
    try: 
        await manager.broadcast_message(league_id, "Draft started!")

        for step in range(1, 5):
            await manager.broadcast_message(league_id, f"Draft step {step}")
            await asyncio.sleep(1) # 1 second
        
        await manager.broadcast_message(league_id, "Draft ended!")
    finally: 
        active_drafts.pop(league_id) 

@router.post("/{league_id}/start")
async def init_draft(league_id: str): 
    if league_id in active_drafts: 
        return {"status": "draft_previously_started"}

    task = asyncio.create_task(run_draft(league_id))
    active_drafts[league_id] = task
    return {"status": "running"}


"""
This websocket helps manage a chat window. It sends json information of the following types:  
1. state - {'type', 'allUsers', 'activeUsers', 'ts'}
2. presence.join - {'type', 'userId', 'ts'}
3. presence.leave - {'type', 'userId', 'ts'}
4. chat.message - {'type', 'userId', 'text', 'ts'}
"""
@router.websocket("/ws/{league_id}/{user_id}")
async def websocket_draft(league_id: str, user_id: str, websocket: WebSocket):
    try: 
        await manager.connect(websocket, league_id, user_id)

        while True: 
            msg = await websocket.receive_text()
            # await manager.broadcast_json(league_id, {
            #     "type": "chat.message", 
            #     "userId": user_id, 
            #     "text": msg, 
            #     "ts": get_now_iso()
            # })

    except WebSocketDisconnect: 
        await manager.disconnect(league_id, user_id)
