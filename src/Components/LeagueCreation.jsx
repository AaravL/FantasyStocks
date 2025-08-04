import {supabase } from "../supabaseClient";
import React, { useState, useEffect } from 'react';

const LeagueCreation = ({ userId }) => {
    const [leagueName, setLeagueName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const createLeague = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
        const { data, error } = await supabase
            .from('leagues')
            .insert([{ name: leagueName, created_by: userId }])
            .select();
        console.log("Insert response:", data, error);
        if (!data || data.length === 0) {
            throw new Error("Failed to create league or no data returned.");
        }
        
        const {dat, err} = await supabase
            .from('league_members')
            .insert([{ user_id: userId, league_id: data[0].league_id }]);
        if (error) {
            throw error;
        }
        console.log("League created successfully:", data);
        } catch (error) {
        setError("An error occurred while creating the league.");
        console.error("Error creating league:", error);
        } finally {
        setLoading(false);
        }
    };
    
    return (
        <div>
        <form onSubmit={createLeague} className="m-auto">
            <h2 className="font-bold pb-2">Create League</h2>
            <input
            type="text"
            placeholder="League Name"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            required
            />
            <button type="submit" disabled={loading}>
            Create League
            </button>
            {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </form>
        </div>
    );
}

export default LeagueCreation;
export { LeagueCreation };
