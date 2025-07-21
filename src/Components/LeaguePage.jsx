import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from '../supabaseClient';

const LeaguePage = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();

  const [leagueName, setLeagueName] = useState("");
  const [leagueCode, setLeagueCode] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

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

    const fetchLeagueMembers = async () => {
      const { data, error } = await supabase
        .from('league_members')
        .select('user_id, display_name')
        .eq('league_id', leagueId);

      if (error) {
        console.error("Error fetching league members:", error);
        setError("Could not fetch members.");
      } else {
        setMembers(data);
      }
    };

    fetchLeagueData();
    fetchLeagueMembers();
  }, [leagueId]);

  return (
    <div className="pt-24 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to: {leagueName}</h1>
      <p className="text-lg mb-4">League Code: {leagueCode}</p>

      <h2 className="text-2xl font-semibold mt-10">League Members:</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul className="mt-4 space-y-2">
        {members.length === 0 ? (
          <p>No members in this league.</p>
        ) : (
          members.map((member, index) => (
            <li key={index} className="text-gray-700">
              {member.display_name || member.user_id}
            </li>
          ))
        )}
      </ul>

      <button
        onClick={handleBackToDashboard}
        className="mt-8 bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default LeaguePage;
