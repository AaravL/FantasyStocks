import {supabase } from "../supabaseClient";
import React, { useState, useEffect } from 'react';

const JoinLeague = ({ userId }) => {
    const [leagueCode, setLeagueCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const HandleJoinLeague = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { data: leagueId, error: leagueError } = await supabase
                .from('leagues')
                .select('league_id')
                .eq('league_code', leagueCode)
            if (leagueError) {
                throw leagueError; 
            }
            if (!leagueId || leagueId.length === 0) {
                throw new Error("League not found.");
            }

            const { data, error } = await supabase
                .from('league_members')
                .insert([{ user_id: userId, league_id: leagueId[0].league_id }]);
            console.log("Joined league successfully:", data);
            if (error) {
                throw error;
            }
        } catch (error) {
            setError("An error occurred while joining the league.");
            console.error("Error joining league:", error);
        } finally {
            setLoading(false);
        }
    }

    return(
        <div>
            <form onSubmit = {HandleJoinLeague} >
                <h2 className="font-bold pb-2">Join League</h2>
                <input
                type="text"
                placeholder="League Code"
                value={leagueCode}
                onChange={(e) => setLeagueCode(e.target.value)}
                required
                />
                <button type="submit" disabled={loading}>
                Join League
                </button>
              {error && <p className="text-red-600 text-center pt-4">{error}</p>}
              </form>
        </div>
    )
}

export default JoinLeague;