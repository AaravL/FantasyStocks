import React, { useState, useEffect, useRef } from "react";
import { useChatContext } from "../context/ChatContext";
import ActiveUsers from "./ActiveUsers";

export default function ChatWindow() { 

    const {messages, sendChat} = useChatContext();
    const [text, setText] = useState("");

    return (
        <div className="flex">
            <div className="w-4/5">
                <p>Message Window </p>
                
                <ul className="w-full bg-white rounded shadow p-4 space-y-1">
                {messages.map((m, i) => (
                    <li key={i} className="text-gray-800 border-b last:border-0 py-1">
                        {m}
                    </li>
                ))}

                <input className="w-full border border-gray-300 text-black" value = {text}
                    type="text" id="textInput" onChange={(e) => setText(e.target.value)} 
                    onKeyDown= { (event) => { 
                        if (event.key === "Enter") { 
                            event.preventDefault();
                            sendChat(text);
                            setText("");
                        }
                }}/>

            </ul>
            
            </div>
            <div className="w-1/5">
                <p>Members</p>
                <ActiveUsers/>
            </div>
        </div>
    );
}