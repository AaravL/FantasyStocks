from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from typing import List, Set, Dict
from enum import Enum 

from websocket import ConnectionManager, UserContextConnectionManager
from time_utils import get_now_iso
from datetime import datetime, timedelta, timezone as tz

from database import get_async_client

router = APIRouter(prefix="/draft", tags=["draft"])

manager = UserContextConnectionManager()
active_drafts: Dict[str, asyncio.Task] = {}

class DraftState(Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

async def set_draft_state(league_id: str, state: DraftState):
    db_client = await get_async_client()
    await db_client.table("leagues").update({"draft_state": state.value}).eq("league_id", league_id).execute()

async def update_info(league_id: str, current_user: str, round_num: int, deadline_iso: str, pick_event: asyncio.Event, draft_state: str):
    lock = await manager.get_lock(league_id)
    async with lock: 
        room_info = manager.room_info[league_id]
        room_info["current_user"] = current_user
        room_info["round_num"] = round_num
        room_info["deadline_iso"] = deadline_iso
        room_info["pick_event"] = pick_event
        room_info["draft_state"] = draft_state

"""
This functions manages the draft event. It sends json information of the following types:  
1. draft.stateChange - {'type', 'draftState'}
2. draft.turnStart - {'type', 'roundNum', 'currentUserId', 'deadline', 'draftState'}
3. draft.turnEnd - {'type', 'roundNum', 'previousUserId', 'draftState'}
"""    
async def run_draft(league_id: str, order: List[str], num_rounds: int = 3, turn_timeout: int = 30): 

    print("STARTING", flush=True)

    await set_draft_state(league_id, DraftState.IN_PROGRESS)
    await manager.broadcast_json(league_id, {'type': 'draft.stateChange', 'draftState' : DraftState.IN_PROGRESS.value})

    print("BEFORE ACTUAL STARTING", flush=True)

    for round in range(1, num_rounds+1):
        pick_order = order if round % 2 == 1 else order[::-1] # For snake draft

        for uid in pick_order: 

            print("STARTING TURN", flush=True)

            pick_event = asyncio.Event()
            deadline = datetime.now(tz.utc) + timedelta(seconds=turn_timeout)

            await update_info(league_id, uid, round, deadline.isoformat(), pick_event, DraftState.IN_PROGRESS.value)
            await manager.broadcast_json(league_id, {
                "type": 'draft.turnStart',
                'roundNum': round, 
                'currentUserId': uid, 
                'deadline': deadline.isoformat(),
                'draftState': DraftState.IN_PROGRESS.value
            })

            print("INFORMATION SENT", flush=True)

            try:  
                await asyncio.wait_for(pick_event.wait(), timeout = turn_timeout)
            except asyncio.TimeoutError: 
                pass

            print("TURN ENDED", flush = True)
                
            await manager.broadcast_json(league_id, {
                "type": 'draft.turnEnd',
                'roundNum': round, 
                'previousUserId': uid, 
                'draftState': DraftState.IN_PROGRESS.value
            })
            
            print("INFROMATION END SENT", flush=True)

    await set_draft_state(league_id, DraftState.COMPLETED)
    await manager.broadcast_json(league_id, {'type': 'draft.stateChange', 'draftState' : DraftState.COMPLETED.value})
    active_drafts.pop(league_id)

    print("DRAFT ENDED", flush=True)


@router.post("/{league_id}/start")
async def init_draft(league_id: str): 

    if league_id in active_drafts: 
        return {"status": "draft_previously_started"}
    
    all_users, _, _  = await manager.get_room_info(league_id)

    task = asyncio.create_task(run_draft(league_id, all_users, num_rounds=3, turn_timeout=30))
    active_drafts[league_id] = task
    return {"status": "running"}

async def handle_user_pick(league_id: str, user_id: str, data: Dict):
    if data.get("type") != "draft.picked":
        return 
    
    lock = await manager.get_lock(league_id)
    async with lock: 
        room_info = manager.room_info[league_id]
        
        if "pick_event" not in room_info or "current_user" not in room_info or room_info["current_user"] != user_id:
            return 
        
        pick_event = room_info["pick_event"]
    
    if not pick_event.is_set():
        pick_event.set()

"""
This websocket helps manage a draft event. It sends json information of the following types:  
1. state - {'type', 'allUsers', 'activeUsers', 'ts'}
2, draft.info - {'type', 'currentUser', 'roundNum', 'deadline', 'draftState'}
2. presence.join - {'type', 'userId', 'ts'}
3. presence.leave - {'type', 'userId', 'ts'}

recieves json of the following type: 
1. {'type': 'draft.picked'}
"""
@router.websocket("/ws/{league_id}/{user_id}")
async def websocket_draft(league_id: str, user_id: str, websocket: WebSocket):
    try: 
        await manager.connect(websocket, league_id, user_id)

        information_present = False
        lock = await manager.get_lock(league_id)
        async with lock: 
            room_info = manager.room_info[league_id]
            if 'current_user' in room_info and 'round_num' in room_info and 'deadline_iso' in room_info and 'draft_state' in room_info:
                information_present = True
                current_user, round_num, deadline_iso, draft_state = room_info['current_user'], room_info['round_num'], room_info['deadline_iso'], room_info['draft_state']

        if information_present:
            await manager.send_json(websocket, { 
                'type': 'draft.info',
                'currentUserId': current_user, 
                'roundNum': round_num, 
                'deadline': deadline_iso,
                'draftState': draft_state
            })

        while True: 
            data = await websocket.receive_json()
            await handle_user_pick(league_id, user_id, data)

    except WebSocketDisconnect: 
        await manager.disconnect(league_id, user_id)
