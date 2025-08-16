import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import Card from "../Card.jsx";

function Button({optionString, handleFunc, toggleValue}) { 
    return (
        <button 
            className={`px-4 py-2 flex-1 ${toggleValue ? "text-green-500" : "text-white"}`}
            onClick={(e) => handleFunc(e, optionString)}
        >
        {optionString.charAt(0).toUpperCase() + optionString.slice(1)}
        </button>
    );
}

function ButtonGroup({optionOneString, optionTwoString, handleFunc, toggleVariable}) { 
    return (
        <div className="flex space-x-2 border">
            <Button optionString={optionOneString} handleFunc={handleFunc} toggleValue={toggleVariable}/>
            <Button optionString={optionTwoString} handleFunc={handleFunc} toggleValue={!toggleVariable}/>
        </div>
    );
}

const handleSell = async ({ leagueMemberId, symbol, stockAmt, vwap, isShares, supabase, setError}) => {
    const shares = isShares ? stockAmt : stockAmt / vwap;
    const totalValue = shares * vwap;

    const { data: holding, error: holdingErr } = await supabase
        .from("holdings")
        .select("*")
        .eq("league_member_id", leagueMemberId)
        .eq("ticker", symbol)
        .single();

    if (holdingErr || !holding) {
        setError("No shares available to sell");
        return;
    }

    const { data: portfolio, error: portfolioErr } = await supabase
        .from("portfolios")
        .select("*")
        .eq("league_member_id", leagueMemberId)
        .single();

    if (portfolioErr || !portfolio) {
        setError("Portfolio not found");
        return;
    }

    const { error: updatePortfolioErr } = await supabase
        .from("portfolios")
        .update({
            current_balance: portfolio.current_balance + totalValue,
        })
        .eq("league_member_id", leagueMemberId);

    if (updatePortfolioErr) {
        setError("Failed to update portfolio balance");
        return;
    }

    const remainingShares = holding.stock_amount - shares;
    const EPSILON = 0.001;

    if (remainingShares < EPSILON) {
        await supabase
            .from("holdings")
            .delete()
            .eq("league_member_id", leagueMemberId)
            .eq("ticker", symbol);
    } else {
        await supabase
            .from("holdings")
            .update({
                stock_amount: remainingShares,
            })
            .eq("league_member_id", leagueMemberId)
            .eq("ticker", symbol);
    }
};

export { handleSell };

const BuySellStock = ({leagueMemberId}) => { 

    const [symbol, setSymbol] = useState("");
    const [stockAmt, setStockAmt] = useState("");
    const [isShares, setIsShares] = useState(true);
    const [isBuy, setIsBuy] = useState(true);
    const [error, setError] = useState('');

    const [result, setResult] = useState(null);
    const [stockError, setStockError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchStockInfo = async (e) => { 

        e.preventDefault();

        setStockError(null);
        setResult(null);
        setLoading(true);

        if (!symbol) { 
            setStockError("Enter a stock ticker to fetch price!");
            return {error: "Enter a stock ticker to fetch price!"};
        }

        try { 
            const res = await fetch(`http://localhost:8000/price?ticker=${symbol}`);
            const data = await res.json();

            if (!res.ok) { 
                setStockError(data.detail || "Stock data not found.");
                return {error : data.detail || "Stock data not found."}
            } else { 
                setResult(data);
                return {result : data}
            }
        } catch (err) { 
            setStockError("Failed to fetch stock price");
            return {error: "Failed to fetch stock price"}
        } finally { 
            setLoading(false);
        }
    }

    const handleBuySell = (e, type) => { 
        e.preventDefault();
        setIsBuy(type === "buy");
    }

    const handleSharesDollars = (e, type) => { 
        e.preventDefault();
        setIsShares(type === "shares");
    }

    const handleSubmit = async (e) => { 
        setError(null);

        e.preventDefault();

        if (!stockAmt) {
            setError("Must enter a non-zero stock amount!");
            return ;  
        }

        const { result, error } = await fetchStockInfo(e);

        if (error) { 
            setError("No transaction due to stock error!");
            return ;
        }

        const vwap = result.price_data.vwap;

        const key = {
            leagueMemberId,
            symbol,
            stockAmt,
            vwap,
            isShares,
        };

        if (isBuy) {
            await handleBuy(key);
        } else {
            await handleSell(key);
        }
        console.log("Transaction successful");        
    }

    const getOrCreatePortfolio = async (leagueMemberId) => {
        let { data: portfolio, error } = await supabase
            .from("portfolios")
            .select("*")
            .eq("league_member_id", leagueMemberId)
            .single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 is "Results contain 0 rows" – not an actual error
            setError("Error fetching portfolio");
            return null;
        }

        if (!portfolio) {
            const { data: inserted, error: insertErr } = await supabase
                .from("portfolios")
                .insert({
                    league_member_id: leagueMemberId,
                    current_balance: 10000,
                    start_of_week_total: 10000,
                })
                .select()
                .single();

            if (insertErr) {
                setError("Error creating new portfolio");
                return null;
            }

            return inserted;
        }

        return portfolio;
    };

    const checkHasTicker = async ({leagueMemberId, symbol}) =>
    {
        console.log("Checking user ownership of ticker:", symbol);
        try{
            const res = await fetch(`http://localhost:8000/hasTicker?leagueMemberId=${leagueMemberId}&ticker=${symbol}`);
            const data = await res.json();
            return data.has_ticker;
        }
        catch (err) {
            console.error("Error checking user ownership ticker:", err);
            return false;
        }
    }


    const handleBuy = async ({ leagueMemberId, symbol, stockAmt, vwap, isShares }) => {
        const hasTicker = await checkHasTicker({ leagueMemberId, symbol });
        if (!hasTicker) {
         setError("You cannot trade this stock");
         throw new Error("You cannot trade this stock");
        }

        const portfolio = await getOrCreatePortfolio(leagueMemberId);
        if (!portfolio) return;

        const shares = isShares ? stockAmt : stockAmt / vwap;
        const totalCost = shares * vwap;

        if (portfolio.current_balance < totalCost) {
            setError("Insufficient balance");
            return;
        }

        // Get current holding (if any)
        const { data: holding, error: holdingErr } = await supabase
            .from("holdings")
            .select("*")
            .eq("league_member_id", leagueMemberId)
            .eq("ticker", symbol)
            .single();

        if (holding && !holdingErr) {
            const newAmount = holding.stock_amount + shares;
            const newUnitCost =
                (holding.stock_amount * holding.stock_unit_cost + shares * vwap) / newAmount;

            await supabase
                .from("holdings")
                .update({
                    stock_amount: newAmount,
                    stock_unit_cost: newUnitCost,
                })
                .eq("league_member_id", leagueMemberId)
                .eq("ticker", symbol);
        } else {
            await supabase.from("holdings").insert({
                league_member_id: leagueMemberId,
                ticker: symbol,
                stock_amount: shares,
                stock_unit_cost: vwap,
            });
        }

        await supabase
            .from("portfolios")
            .update({
                current_balance: portfolio.current_balance - totalCost,
            }).eq("league_member_id", leagueMemberId);
    };



    return (
        <form onSubmit={handleSubmit}> 
            {/* Top row (ticker symbol + optional information) */}
            <div className="flex items-center">
                <input id="ticker" type="text" placeholder="ticker" className="border p-2 rounded outline outline-white focus:outline-blue-700"
                    value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            fetchStockInfo(e);  
                        }
                    }}
                />

                {loading && <p className="text-yellow-400 ml-4">Loading...</p>}

                {stockError && !loading && (
                    <p className="text-red-600 mt-4 text-center">{stockError}</p>
                )}

                {result?.price_data && !loading && (
                    <>
                        <p><strong>Price:</strong> ${result.price_data.vwap}</p>
                        <p><strong>Timestamp:</strong> {new Date(result.price_data.timestamp).toLocaleString()}</p>
                    </>
                )}
            </div>

            {/* Middle row (buy/sell shares/amt text entry) */}
            <div className="mt-2 flex items-center space-x-4 p-2">
                <div className="grid grid-cols-2 gap-4">
                <ButtonGroup optionOneString={"buy"} optionTwoString={"sell"} handleFunc={handleBuySell} toggleVariable={isBuy} />
                <ButtonGroup optionOneString={"shares"} optionTwoString={"dollars"} handleFunc={handleSharesDollars} toggleVariable={isShares}/>
                </div>

                <input
                    id="amount" type="number" placeholder={`${isShares ? "Share amount" : "Dollar Amount"}`} 
                    className="mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value = {stockAmt} onChange={(e) => {
                        let value = Number(e.target.value);
                        if (value === 0) value = "";
                        setStockAmt(value)
                    
                    }}
                />
            </div>

            <div>
                <button type="submit" className="bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition">
                Submit
                </button>
            </div>
            
            <div>
                {error && (
                    <p className="text-red-600 mt-4 text-center">{error}</p>
                )}
            </div>
        </form>
    );
}

export default BuySellStock;