import React, { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { DraftContext } from "../context/DraftContext.jsx";
import { DraftState } from "../constants/draftState";
import Draft from "./Draft";

const MakeAction = ({leagueId, leagueMemberId}) => { 
  const [ticker, setTicker] = useState("");
  const [userStocks, setUserStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserStocks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_stocks")
      .select("Ticker")
      .eq("league_member_id", leagueMemberId);

    if (error) {
      console.error("Error fetching user stocks:", error);
    } else {
      setUserStocks(data.map((stock) => stock.Ticker));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (leagueMemberId) {
      fetchUserStocks();
    }
  }, [leagueMemberId]);

  const handleAddStock = async (ticker) => {

    setLoading(true);
    setUserStocks([]);

    try {
      const res = await fetch("http://localhost:8000/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_member_id: leagueMemberId,
          league_id: leagueId, // from URL params
          ticker: ticker
        })
      });

      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    } finally { 
      fetchUserStocks();
    }
  };

  async function removeStock(stock) {

    setLoading(true);
    setUserStocks([]);

    try {
      const res = await fetch("http://localhost:8000/remove-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_member_id: leagueMemberId,
          league_id: leagueId, // from URL params
          ticker: stock
        })
      });

      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    } finally { 
      fetchUserStocks();
    }
  };

  return (
    <div style={{margin: "auto", padding: "20px" }}>
      <h2>Manage Your Tradable Stocks</h2>

      {/* Add stock form */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL)"
          style={{ flex: 1 }}
        />
        <button onClick={() => handleAddStock(ticker)}>Add</button>
      </div>

      {/* Stock list */}
      <h3>Your Stocks</h3>

      {loading && 
        <p className="text-yellow-300">Loading stocks!</p>
      }

      {userStocks.length === 0 && !loading? (
        <p>No stocks yet. Add one above!</p>
      ) : (
        <ul>
          {userStocks.map((stock) => (
            <li key={stock} style={{ display: "flex", justifyContent: "space-between" }}>
              {stock}
              <button onClick={() => removeStock(stock)} disabled={loading}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DefaultMessage = ({leagueId, onDraftChange}) => {

  const [error, setError] = useState("");

  async function startDraft() { 

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
    <>
      <p> Draft has not occured yet! When everyone in the league is ready, click the button below to begin!</p>
      <button onClick ={startDraft}>Start Draft</button>
      {error && <p>{error}</p>}
    </>
  );
}

const AddDropStock = ({leagueId, userId, leagueMemberId}) => {

  const [league, setLeague] = useState(null);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(prev => (prev + 1) % 2); 

  useEffect(() => { 
    const fetchLeague = async () => { 
      const { data, error } = await supabase
      .from("leagues")
      .select("*")
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
      {league?.draft_state == DraftState.NOT_STARTED && <DefaultMessage leagueId = {leagueId} onDraftChange={refresh} />}
      {league?.draft_state == DraftState.IN_PROGRESS && 
      <DraftContext.Provider>
        <Draft leagueId={leagueId} userId={userId} leagueMemberId={leagueMemberId} onDraftChange={refresh}/>
      </DraftContext.Provider>}
      {league?.draft_state == DraftState.COMPLETED && <MakeAction leagueId={leagueId} leagueMemberId={leagueMemberId} />}

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