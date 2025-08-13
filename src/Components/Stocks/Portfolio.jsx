import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const Portfolio = ({leagueMemberId}) => { 

    const [weekStartAmt, setWeekStartAmt] = useState(null);
    const [currentBalance, setCurrentBalance] = useState(null);
    const [holdings, setHoldings] = useState([]);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const getCurrentTotal = () => { 
        return currentBalance; // Also add in stocks 
    }

    const fetchPortfolioInfo = async () => { 
        let { data : portfolio, error } = await supabase
            .from("portfolios")
            .select("*")
            .eq("league_member_id", leagueMemberId)
            .single();

        if (error) { 
            setError(error);
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
        let { data : holdings, error } = await supabase
            .from('holdings')
            .select('*')
            .eq('league_member_id', leagueMemberId);
        
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
            await Promise.all([
                fetchPortfolioInfo(),
                fetchHoldingsInfo(),
            ]);
        } catch (err) {
            setError("Something went wrong");
            console.log(err);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchStockInfo();
    }, [leagueMemberId]);

    if (!loading && !error && holdings.length === 0) {
          return (
             <div className="space-y-4">
                 <p className="text-yellow-400">Portfolio is empty.</p>
             </div>
      );
    }
    return (
        <div className="space-y-4">
            
            {loading && <p className="text-yellow-400">Loading...</p>}
            {error && !loading && <p className="text-red-600">{error.message}</p>}

            {!loading && !error && (
                <>
                <div className="flex items-center space-x-4">
                    <p><strong>Week Starting Amount:</strong> {weekStartAmt}</p>
                    <p><strong>Current Balance:</strong> {currentBalance}</p>
                </div>

                {holdings.map(data =>
                    <div key = {data.league_member_id + " " + data.ticker} className="flex space-x-4">
                        <p><strong>Ticker:</strong> {data.ticker}</p>
                        <p><strong># of Shares:</strong> {data.stock_amount}</p>
                        <p><strong>Average Share Cost:</strong> {data.stock_unit_cost}</p>
                    </div>
                )}
                </>
            )}

            <button onClick={fetchStockInfo} className= "flex-1 px-4 py-2 text-sm font-medium">Refresh </button>
        </div>
    );
}

export default Portfolio;