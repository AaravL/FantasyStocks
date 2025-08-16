import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { DraftState } from "../constants/draftState";

export default function Draft({leagueId, userId, leagueMemberId, onDraftChange}) { 

    const [messages, setMessages] = useState([]);
    const wsRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/draft/ws/${leagueId}/${userId}`)
        wsRef.current = ws; 

        ws.onmessage = (event) => { 
            try { 
                console.log(event.data);
                let data = JSON.parse(event.data);

                switch (data.type) { 
                    case "presence.leave": { 
                        setMessages((prev) => [...prev, "USER LEAVE: " + data.userId]);
                        break;
                    }
                    
                    case "presence.join": { 
                        setMessages((prev) => [...prev, "USER JOIN: " + data.userId]);
                        break;
                    }
                }
            } catch (error) {
                setMessages((prev) => [...prev, event.data]);
                return;
            }
        };

        ws.onclose = () => console.log("ws closed");

        return () => {
            try { ws.close(); } catch {}
            wsRef.current = null;
        };

    }, []);

    const sendOk = () => { 
        if (wsRef.current?.readyState === WebSocket.OPEN) { 
            wsRef.current.send("ok");
        }
    };

    return (
        <div>
            <p>Draft page!! Exciting wooohooo!</p>
            <button
                onClick={sendOk}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
            Send OK
            </button>

            <ul className="w-full bg-white rounded shadow p-4 space-y-1">
                {messages.map((m, i) => (
                <li key={i} className="text-gray-800 border-b last:border-0 py-1">
                    {m}
                </li>
                ))}
            </ul>

        </div>
    );
}