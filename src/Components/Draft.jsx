import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { DraftState } from "../constants/draftState";
import { useDraftContext } from "../context/DraftContext";
import { UserDisplayWrapper } from "./ActiveUsers";

import MakeAddDropAction from "./MakeAddDropAction";

const ActionWrapper = ({leagueId, leagueMemberId}) => { 

    return (
        <div className="border-2 border-white m-3"><MakeAddDropAction leagueId={leagueId} leagueMemberId={leagueMemberId}/></div>
    );
}

export default function Draft({leagueId, leagueMemberId, setDraftState}) { 

    const {userId, activeMap, currentTurnUser} = useDraftContext();

    const getUserColor = (user_id) => { 
        if (user_id === currentTurnUser) { 
            return "text-blue-600";
        }
        if (activeMap.get(String(user_id))) { 
            return "text-white";
        }
        return "text-gray-700";
    }

    return (
        <UserDisplayWrapper contextCallback={useDraftContext} getUserColor={getUserColor}>
            <p className="text-2xl text-fuchsia-500 mb-2" >We are currently in a draft!!!</p>

            {userId !== currentTurnUser && <p>Please wait for your turn!</p>}

            {userId === currentTurnUser && 
            <>
                <p>It is your turn!</p>
                <ActionWrapper leagueId={leagueId} leagueMemberId={leagueMemberId}/>
            </>}
        </UserDisplayWrapper>
    );
}