from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from typing import List, Set, Dict

from websocket import ConnectionManager, UserContextConnectionManager
from time_utils import get_now_iso

from database import get_async_client

from enum import Enum 
class DraftState(Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

async def set_draft_state(league_id: str, state: DraftState):
    db_client = await get_async_client()
    await db_client.table("leagues").update({"draft_state": state.value}).eq("league_id", league_id).execute()

    print("UPDATED DATABASE")


router = APIRouter(prefix="/draft", tags=["draft"])

manager = UserContextConnectionManager()
active_drafts: Dict[str, asyncio.Task] = {}

"""
This functions manages the draft event. It sends json information of the following types:  
1. state - {'type', 'allUsers', 'activeUsers', 'ts'}
2. presence.join - {'type', 'userId', 'ts'}
3. presence.leave - {'type', 'userId', 'ts'}
4. draft.stateChange - {'type', 'draftState'}
5. draft.nextTurn - {'type', 'userId'}
6. draft.end - {'type'}
"""
async def run_draft(league_id: str): 

    await set_draft_state(league_id, DraftState.IN_PROGRESS)

    try: 
        #Draft Logic
        await manager.broadcast_json(league_id, {'type': 'draft.stateChange', 'draftState' : DraftState.IN_PROGRESS})
 
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
This websocket helps manage a draft event. It sends json information of the following types:  
1. state - {'type', 'allUsers', 'activeUsers', 'ts'}
2. presence.join - {'type', 'userId', 'ts'}
3. presence.leave - {'type', 'userId', 'ts'}
4. draft.stateChange - {'type', 'draftState'}
5. draft.nextTurn - {'type', 'userId'}
6. draft.end - {'type'}
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
