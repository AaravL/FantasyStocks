from fastapi import WebSocket, WebSocketDisconnect
import asyncio
from typing import List, Dict, Callable, Awaitable, Any, Tuple, Optional

from database import get_async_client
from time_utils import get_now_iso

class ConnectionManager: 
    def __init__(self): 
        self.rooms: Dict[str, Dict[str, WebSocket]] = {} # {league_id -> {user_id -> websocket}}
        self.room_users: Dict[str, List[str]] = {} # {league_id -> [all_users]}
        self.locks: Dict[str, asyncio.Lock] = {}
        self.lock_access = asyncio.Lock()

    async def load_league_users(self, league_id: str) -> List[str]:
        db_client = await get_async_client()
        response = await db_client.table("league_members").select("user_id").eq("league_id", league_id).execute()

        if response.data is None:
            print(f"Error fetching league members: {response.error}")
            raise ValueError("Could not fetch league members!")

        return [user["user_id"] for user in response.data]

    async def get_lock(self, league_id: str) -> asyncio.Lock: 
        async with self.lock_access: 
            if league_id not in self.locks: 
                self.locks[league_id] = asyncio.Lock()
            return self.locks[league_id]
        
    async def delete_lock(self, league_id: str): 
        async with self.lock_access:
            self.locks.pop(league_id, None)

    """
    Returns all_users, active_users 
    """
    async def get_room_info(self, league_id: str) -> Tuple[List[str], List[str]]: 
        lock = await self.get_lock(league_id)
        async with lock: 
            return self.room_users.get(league_id, []), list(self.rooms.get(league_id, {}).keys())

    async def connect(self, websocket: WebSocket, league_id: str, user_id: str): 
        await websocket.accept()

        all_users: Optional[List[str]] = None
        if league_id not in self.room_users: 
            all_users = await self.load_league_users(league_id)
        
        lock = await self.get_lock(league_id)
        async with lock:
            room = self.rooms.setdefault(league_id, {})
            room[user_id] = websocket

            if league_id not in self.room_users:
                if all_users is None: # Guard against the enter then last user disconnects case
                    all_users = await self.load_league_users(league_id) 
                self.room_users[league_id] = all_users

    async def disconnect(self, league_id: str, user_id: str):
        lock = await self.get_lock(league_id)
        async with lock:
            if league_id in self.rooms and user_id in self.rooms[league_id]:
                del self.rooms[league_id][user_id]
                if not self.rooms[league_id]: 
                    del self.rooms[league_id]
                    del self.room_users[league_id]
        
        if league_id not in self.room_users:
            await self.delete_lock(league_id)
        
    async def _broadcast_core(self, league_id: str, content: str | Dict, func: Callable[[WebSocket, Any], Awaitable[None]]):
        lock = await self.get_lock(league_id)
        async with lock: 
            if league_id not in self.rooms or not self.rooms[league_id]:
                return 
            
            items = list(self.rooms[league_id].items())

        tasks = [func(websocket, content) for _, websocket in items]    
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for (user_id, _), result in zip(items, results):
            if isinstance(result, (WebSocketDisconnect, ConnectionError, RuntimeError, Exception)):
                try: 
                    await self.disconnect(league_id, user_id)
                except Exception: 
                    pass

    async def broadcast_message(self, league_id: str, message: str):
        await self._broadcast_core(league_id, message, self.send_message)

    async def broadcast_json(self, league_id: str, data: Dict):
        await self._broadcast_core(league_id, data, self.send_json)

    async def send_message(self, websocket: WebSocket, message: str):
        await websocket.send_text(message)

    async def send_json(self, websocket: WebSocket, data: Dict): 
        await websocket.send_json(data)


class UserContextConnectionManager(ConnectionManager):
    async def connect(self, websocket: WebSocket, league_id: str, user_id: str): 
        await super().connect(websocket, league_id, user_id)

        all_users, active_users = await self.get_room_info(league_id)
        await self.send_json(websocket, {
            "type": "state", 
            "allUsers": all_users, 
            "activeUsers": active_users, 
            "ts": get_now_iso()
        }) 

        await self.broadcast_json(league_id, {
            "type": "presence.join", 
            "userId": user_id, 
            "ts": get_now_iso()
        })

    async def disconnect(self, league_id: str, user_id: str):
        await super().disconnect(league_id, user_id)

        await self.broadcast_json(league_id, {
            "type": "presence.leave", 
            "userId": user_id, 
            "ts": get_now_iso()
        })

    

