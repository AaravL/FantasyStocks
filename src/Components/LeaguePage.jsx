import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from '../supabaseClient';

const LeaguePage = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();

  const [leagueName, setLeagueName] = useState("");
  const [leagueCode, setLeagueCode] = useState("");

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const fetchLeagueData = async () => {
      const { data: nameData, error: nameError } = await supabase
        .from('leagues')
        .select('name')
        .eq('league_id', leagueId)
        .single();

      const { data: codeData, error: codeError } = await supabase
        .from('leagues')
        .select('league_code')
        .eq('league_id', leagueId)
        .single();

      if (nameData) setLeagueName(nameData.name);
      if (codeData) setLeagueCode(codeData.league_code);

      if (nameError || codeError) {
        console.error("Error fetching league data:", nameError || codeError);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

  const fetchLeagueMembers = async () => {
    const { data, error } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId);

    if (error) {
      console.error("Error fetching league members:", error);
    }
    return data;
  };


  return (
    <div className="pt-24 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to: {leagueName}</h1>
      <p className="text-lg mb-4">League Code: {leagueCode}</p>
      <button
        onClick={handleBackToDashboard}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default LeaguePage;