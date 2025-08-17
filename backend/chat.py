from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from typing import List, Set, Dict

from websocket import ConnectionManager, UserContextConnectionManager
from time_utils import get_now_iso

router = APIRouter(prefix="/chat", tags=["chat"])
manager = UserContextConnectionManager()
users_ids = set()

"""
This websocket helps manage a chat window. It sends json information of the following types:  
1. state - {'type', 'allUsers', 'activeUsers', 'ts'}
2. presence.join - {'type', 'userId', 'ts'}
3. presence.leave - {'type', 'userId', 'ts'}
4. chat.message - {'type', 'userId', 'text', 'ts'}
"""
@router.websocket("/ws/{league_id}/{user_id}")
async def chat_websocket(league_id: str, user_id: str, websocket: WebSocket):
    try: 
        await manager.connect(websocket, league_id, user_id)

        while True: 
            msg = await websocket.receive_text()
            await manager.broadcast_json(league_id, {
                "type": "chat.message", 
                "userId": user_id, 
                "text": msg, 
                "ts": get_now_iso()
            })

    except WebSocketDisconnect: 
        await manager.disconnect(league_id, user_id)