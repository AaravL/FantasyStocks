import React, { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

export default function ManageStocksPage() {
  const [ticker, setTicker] = useState("");
  const [userStocks, setUserStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leagueMemberId, setLeagueMemberId] = useState(null);

  const { leagueId } = useParams();
  const user = UserAuth();
  const userId = user?.session?.user?.id;

  // Fetch user's stocks on load

  useEffect(() => {
  const fetchLeagueMemberId = async () => {
    const { data, error } = await supabase
      .from("league_members")
      .select("league_member_id")
      .eq("user_id", userId)
      .eq("league_id", leagueId)
      .single();

    if (error) {
      console.error("Error fetching league_member_id:", error.message || error);
    } else {
      setLeagueMemberId(data.league_member_id);
 
    }};
    fetchLeagueMemberId();
  }, [userId, leagueId]
)

  useEffect(() => {
  const fetchUserStocks = async () => {
    const { data, error } = await supabase
      .from("user_stocks")
      .select("Ticker")
      .eq("league_member_id", leagueMemberId);

    if (error) {
      console.error("Error fetching user stocks:", error);
    } else {
      setUserStocks(data.map((stock) => stock.Ticker));
    }
  };

  if (leagueMemberId) {
    fetchUserStocks();
  }
}, [leagueMemberId]);

  const handleAddStock = async (ticker) => {
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
  }
};

  async function removeStock(stock) {
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
  }
  };

  if (!leagueMemberId) {
    return (
      <div className="pt-24 text-center">
        <p>Loading league data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: "20px" }}>
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
      {userStocks.length === 0 ? (
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