import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

// Helper to conditionally apply green/red for dollar values
const getDollarClass = (value) => {
  if (typeof value !== "number") return "text-gray-400";
  return value < 0 ? "text-red-400" : "text-green-400";
};

const Portfolio = ({ leagueMemberId }) => {
  const [weekStartAmt, setWeekStartAmt] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolioInfo = async () => {
    const { data: portfolio, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("league_member_id", leagueMemberId)
      .single();

    if (error) {
      if (error.message.includes("no) rows returned")) {
        setHoldings([]);
        setError(null);
      } else {
        setError(error);
      }
    } else {
      setWeekStartAmt(portfolio.start_of_week_total);
      setCurrentBalance(portfolio.current_balance);
    }
  };

  const fetchHoldingsInfo = async () => {
    const { data: holdings, error } = await supabase
      .from("holdings")
      .select("*")
      .eq("league_member_id", leagueMemberId);

    if (error) {
      setError(error);
    } else {
      setHoldings(holdings);
    }
  };

  const fetchStockInfo = async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([fetchPortfolioInfo(), fetchHoldingsInfo()]);
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStockInfo();
  }, [leagueMemberId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black py-10 px-4 text-white">
      <h2 className="text-3xl font-bold mb-8 text-center text-blue-400">Portfolio</h2>

      {loading && <p className="text-blue-300 text-center">Loading...</p>}
      {error && !loading && (
        <p className="text-red-500 text-center">{error.message}</p>
      )}
      {!loading && !error && holdings.length === 0 && (
        <p className="text-blue-300 text-center">Portfolio is empty.</p>
      )}

      {!loading && !error && holdings.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Portfolio Summary */}
          <div className="bg-zinc-900 p-6 rounded-lg shadow border border-zinc-800">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <p>
                <span className="text-blue-300 font-semibold">Week Starting Amount:</span>{" "}
                <span className={getDollarClass(weekStartAmt)}>
                  ${weekStartAmt?.toLocaleString() ?? "—"}
                </span>
              </p>
              <p>
                <span className="text-blue-300 font-semibold">Current Balance:</span>{" "}
                <span className={getDollarClass(currentBalance)}>
                  ${currentBalance?.toLocaleString() ?? "—"}
                </span>
              </p>
            </div>
          </div>

          {/* Holdings List */}
          <div className="bg-zinc-900 p-6 rounded-lg shadow border border-zinc-800 space-y-4">
            <h3 className="text-xl text-blue-400 font-semibold">Holdings</h3>
            {holdings.map((data) => (
              <div
                key={data.league_member_id + "-" + data.ticker}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300"
              >
                <p>
                  <span className="text-blue-300 font-semibold">Ticker:</span>{" "}
                  {data.ticker}
                </p>
                <p>
                  <span className="text-blue-300 font-semibold"># of Shares:</span>{" "}
                  {data.stock_amount}
                </p>
                <p>
                  <span className="text-blue-300 font-semibold">Avg Share Cost:</span>{" "}
                  <span className={getDollarClass(data.stock_unit_cost)}>
                    ${data.stock_unit_cost}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={fetchStockInfo}
          className="bg-black border border-white text-blue-400 hover:bg-white hover:text-black transition-all duration-200 rounded px-6 py-2 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default Portfolio;
