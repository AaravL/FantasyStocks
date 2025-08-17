import React, { useState, useEffect, useRef } from "react";
import { useChatContext } from "../context/ChatContext";

export function ActiveUsers({ contextCallback, getUserColor = null }) { 
    const {members, activeMap} = contextCallback();

    const defaultGetUserColor = (user_id) => { 
        if (activeMap.get(String(user_id))) { 
            return "text-white";
        }
        return "text-gray-700";
    }

    const colorFunc = getUserColor ?? defaultGetUserColor

    return (
        <div>
            <ul className="mt-4 space-y-2">
                {members.map((member) => (
                    <li key={member.user_id} className={`${colorFunc(member.user_id)}`}>
                        {member.display_name || member.user_id}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function UserDisplayWrapper({contextCallback, getUserColor, children}) { 
    return (
        <div className="flex">
            <div className="w-4/5">
                {children}
            </div>
            <div className="w-1/5">
                <p>Members</p>
                <ActiveUsers contextCallback={contextCallback} getUserColor={getUserColor}/> 
            </div>
        </div>
    );
}