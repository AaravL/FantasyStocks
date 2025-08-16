import React, { useState, useEffect, useRef } from "react";
import ActiveUsers from "./ActiveUsers";

export default function ChatWindow({ leagueId, userId }) { 

    const [messages, setMessages] = useState([]);

    return (
        <div class="flex">
            <div class="w-4/5">Message Window</div>
            <div class="w-1/5">
                <ActiveUsers leagueId={leagueId} userId={userId}/>
            </div>
        </div>
    );
}