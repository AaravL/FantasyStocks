import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DraftContextProvider, useDraftContext } from "../context/DraftContext.jsx";
import { DraftState } from "../constants/draftState";
import Draft from "./Draft";
import { UserDisplayWrapper } from "./ActiveUsers.jsx";
import MakeAddDropAction from "./MakeAddDropAction.jsx";

const DefaultMessage = ({leagueId, onDraftChange}) => {

  const [error, setError] = useState("");
  const {activeMap} = useDraftContext();

  async function startDraft() { 

    for (const present of activeMap.values()) { 
      if (present === false) { 
        alert("Everyone must be present before starting the draft!");
        return ;
      }
    }


    await fetch(`http://localhost:8000/draft/${leagueId}/start`, { 
      method: "POST",
    });

    const { data, error } = await supabase
    .from("leagues")
    .update({ draft_state: DraftState.IN_PROGRESS })
    .eq("league_id", leagueId);

    if (error) { 
      setError("Error (" + error.message + "), please try again later");
      console.log(error.message)
    } 
    
    onDraftChange();
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

  const [league, setLeague] = useState(null);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(prev => (prev + 1) % 2); 

  useEffect(() => { 
    const fetchLeague = async () => { 
      const { data, error } = await supabase
      .from("leagues")
      .select("draft_state")
      .eq("league_id", leagueId)
      .single();
      
      if (error) { 
        setError(error);
      } else { 
        setLeague(data)
      }
    }

    fetchLeague();
  }, [leagueId, refreshKey]);
  

  return  ( 
    <div>
      {league?.draft_state == DraftState.NOT_STARTED && 
        <DraftContextProvider leagueId={leagueId} userId={userId} leagueMemberId={leagueMemberId} members = {members}>
          <DefaultMessage leagueId = {leagueId} onDraftChange={refresh} />
        </DraftContextProvider>
      }
      
      {league?.draft_state == DraftState.IN_PROGRESS && 
        <DraftContextProvider leagueId={leagueId} userId={userId} leagueMemberId={leagueMemberId} members = {members}>
          <Draft leagueId={leagueId} leagueMemberId={leagueMemberId} onDraftChange={refresh}/>
        </DraftContextProvider>
      }
      
      {league?.draft_state == DraftState.COMPLETED && <MakeAddDropAction leagueId={leagueId} leagueMemberId={leagueMemberId}/>}

      <button onClick ={ async () => {
        const { data, error } = await supabase
        .from("leagues")
        .update({ draft_state: DraftState.NOT_STARTED })
        .eq("league_id", leagueId);

        refresh();
      }}>TEMP RESET STATE BUTTON</button>

    </div>
  );
}

export default AddDropStock;