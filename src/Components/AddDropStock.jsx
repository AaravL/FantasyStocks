import React, { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { handleSell } from "./Stocks/BuySellStock";

const AddDropStock = ({leagueId, leagueMemberId}) => {
  const [ticker, setTicker] = useState("");
  const [userStocks, setUserStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    const priceRes = await fetch(`http://localhost:8000/price?ticker=${stock}`);
    const priceData = await priceRes.json();

    if (!priceRes.ok) {
      console.error(priceData.detail || "Stock data not found");
      setLoading(false);
      return;
    }

    const vwap = priceData.price_data.vwap; // actual VWAP

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
      await handleSell({
        leagueMemberId,
        symbol: stock,
        stockAmt: 1000000, // sell all
        vwap,
        isShares: true,
        supabase,
        setError
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

      {error && <p className="text-red-600">{error}</p>}
      
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

export default AddDropStock;