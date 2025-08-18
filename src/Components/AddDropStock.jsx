import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DraftContextProvider, useDraftContext } from "../context/DraftContext.jsx";
import { DraftState } from "../constants/draftState";
import Draft from "./Draft";
import { UserDisplayWrapper } from "./ActiveUsers.jsx";
import MakeAddDropAction from "./MakeAddDropAction.jsx";

const DefaultMessage = ({leagueId, setDraftState}) => {

  const [error, setError] = useState("");
  const {activeMap, draftState} = useDraftContext();

  useEffect(() => { 
    setDraftState(draftState);
  }, [draftState])

  async function startDraft() { 
    for (const present of activeMap.values()) { 
      if (present === false) { 
        alert("Everyone must be present before starting the draft!");
        return ;
      }
    }

    const res = await fetch(`http://localhost:8000/draft/${leagueId}/start`, { 
      method: "POST",
    });

    if (!res.ok) { 
      alert("Something went wrong");
    }

    setDraftState(DraftState.IN_PROGRESS);
  }

  return (
    <UserDisplayWrapper contextCallback={useDraftContext}>
      <p> Draft has not occured yet! When everyone in the league is ready, click the button below to begin!</p>
      <button onClick ={startDraft}>Start Draft</button>
      {error && <p className="text-red-600">{error}</p>}
    </UserDisplayWrapper>
  );
}

const AddDropStock = ({leagueId, userId, leagueMemberId, members}) => {

  const [draftState, setDraftState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { 
    const fetchDraftState = async () => { 
      const { data, error } = await supabase
      .from("leagues")
      .select("draft_state")
      .eq("league_id", leagueId)
      .single();
      
      if (error) { 
        setError(error);
      } else { 
        setDraftState(data.draft_state);
      }
    }

    fetchDraftState();
  }, [leagueId]);
  

  return  ( 
    <div>
      {draftState && draftState == DraftState.NOT_STARTED && 
        <DraftContextProvider leagueId={leagueId} userId={userId} leagueMemberId={leagueMemberId} members = {members}>
          <DefaultMessage leagueId = {leagueId} setDraftState={setDraftState} />
        </DraftContextProvider>
      }
      
      {draftState && draftState == DraftState.IN_PROGRESS && 
        <DraftContextProvider leagueId={leagueId} userId={userId} leagueMemberId={leagueMemberId} members = {members}>
          <Draft leagueId={leagueId} leagueMemberId={leagueMemberId} setDraftState={setDraftState}/>
        </DraftContextProvider>
      }
      
      {draftState && draftState == DraftState.COMPLETED && <MakeAddDropAction leagueId={leagueId} leagueMemberId={leagueMemberId}/>}

      <button onClick ={ async () => {
        const { data, error } = await supabase
        .from("leagues")
        .update({"draft_state": DraftState.NOT_STARTED})
        .eq("league_id", leagueId);

        setDraftState(DraftState.NOT_STARTED);
      }}>TEMP RESET STATE BUTTON</button>

    </div>
  );
}

export default AddDropStock;