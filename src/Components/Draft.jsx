import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { DraftState } from "../constants/draftState";
import { useDraftContext } from "../context/DraftContext";
import { UserDisplayWrapper } from "./ActiveUsers";

import MakeAddDropAction from "./MakeAddDropAction";

const ActionWrapper = ({leagueId, leagueMemberId, callBack = null}) => { 
    return (
        <div className="border-2 border-white m-3"><MakeAddDropAction leagueId={leagueId} leagueMemberId={leagueMemberId} callBack={callBack}/></div>
    );
}

const Timer = ({ deadline }) => {
  const [remaining, setRemaining] = useState(() => deadline - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(deadline - Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, [deadline]);

  if (remaining <= 0) return <span>00:00</span>;

  const minutes = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return <span>{minutes}:{seconds}</span>;
};


export default function Draft({leagueId, leagueMemberId, setDraftState}) { 

    const {userId, roundNum, deadline, activeMap, currentTurnUser, notifyDraftPick, draftState} = useDraftContext();

    useEffect(() => {
        if (draftState !== null && draftState !== undefined) {  
            setDraftState(draftState);
        }
    }, [draftState])

    const getUserColor = (user_id) => { 
        if (currentTurnUser && user_id === currentTurnUser && activeMap.get(String(user_id))) { 
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
            {roundNum && deadline && <p> It is round number {roundNum}. The timer is: <Timer deadline={Date.parse(deadline)} /> </p>}

            {userId !== currentTurnUser && <p>Please wait for your turn!</p>}

            {userId === currentTurnUser && 
            <>
                <p>It is your turn!</p>
                <ActionWrapper leagueId={leagueId} leagueMemberId={leagueMemberId} callBack={notifyDraftPick}/>
            </>}
        </UserDisplayWrapper>
    );
}