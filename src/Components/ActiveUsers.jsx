import React, { useState, useEffect, useRef } from "react";
import { useChatContext } from "../context/ChatContext";

export default function ActiveUsers() { 

    const {members, activeMap} = useChatContext();

    return (
        <div>
            <ul className="mt-4 space-y-2">
                {members.map((member) => (
                    <li key={member.user_id} className={`${activeMap.get(String(member.user_id))? "text-white" : "text-gray-700"}`}>
                        {member.display_name || member.user_id}
                    </li>
                ))}
            </ul>
        </div>
    );
}