import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import BuySellStock from "./Stocks/BuySellStock";
import Portfolio from "./Stocks/Portfolio";
import { generateMatchups } from "./matchups"; // Adjust path as needed
import Card from "./Card.jsx";

const tabs = ["Matchup", "Buy/Sell Stock", "Portfolio"];

const LeaguePage = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { session } = UserAuth();

  const [leagueName, setLeagueName] = useState("");
  const [leagueCode, setLeagueCode] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [newLeagueDisplayName, setNewLeagueDisplayName] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [matchupStatus, setMatchupStatus] = useState("");
  const [matchupLoading, setMatchupLoading] = useState(false);

  const [leagueMemberId, setLeagueMemberId] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[1]);

  const userId = session?.user?.id;

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const fetchLeagueData = async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("name, league_code")
        .eq("league_id", leagueId)
        .single();

      if (data) {
        setLeagueName(data.name);
        setLeagueCode(data.league_code);
      }

      if (error) {
        console.error("Error fetching league data:", error);
      }
    };

    const fetchLeagueMembers = async () => {
      const { data, error } = await supabase
        .from("league_members")
        .select("user_id, display_name")
        .eq("league_id", leagueId);

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

  useEffect(() => {

    const fetchLeagueMemberId = async () => { 
      if (!userId || !leagueId) return;

      const {data, error} = await supabase 
        .from("league_members")
        .select("league_member_id")
        .eq("user_id", userId)
        .eq("league_id", leagueId)
        .single();
      
      if (error) { 
        console.error("Error fetching league member id:", error);
        setError("Could not fetch league member id.");
        return null;
      } 

      if (!data) { 
        console.error("Error finding league member id:", error);
        setError("Could not finding league member id.");
        return null; 
      }

      setLeagueMemberId(data.league_member_id);  // You'd define this with useState
    };

    fetchLeagueMemberId();
  }, [userId, leagueId]);

  const handleDisplayNameChange = async (e) => {
    e.preventDefault();
    setUpdateMessage("");

    const { error } = await supabase
      .from("league_members")
      .update({ display_name: newLeagueDisplayName })
      .eq("league_id", leagueId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update display name:", error);
      setUpdateMessage("Failed to update display name.");
    } else {
      setUpdateMessage("Display name updated!");
      setNewLeagueDisplayName("");

      const { data, error: fetchError } = await supabase
        .from("league_members")
        .select("user_id, display_name")
        .eq("league_id", leagueId);

      if (!fetchError) setMembers(data);
    }
  };

  const handleGenerateMatchups = () => {
    generateMatchups(leagueId, setMatchupStatus, setMatchupLoading);
  };

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
          members.map((member) => (
            <li key={member.user_id} className="text-gray-700">
              {member.display_name || member.user_id}
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={handleDisplayNameChange}
        className="mt-10 space-y-4 max-w-md mx-auto"
      >
        <h3 className="text-xl font-bold">Change League Profile</h3>
        <input
          type="text"
          placeholder="New League Display Name"
          value={newLeagueDisplayName}
          onChange={(e) => setNewLeagueDisplayName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Update Display Name
        </button>
        {updateMessage && (
          <p className="text-sm text-blue-600">{updateMessage}</p>
        )}
      </form>

      <div className="mt-6">
        <button
          onClick={handleGenerateMatchups}
          disabled={matchupLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {matchupLoading ? "Generating Matchups..." : "Generate Matchups"}
        </button>
        {matchupStatus && (
          <p className="mt-2 text-sm text-gray-700">{matchupStatus}</p>
        )}
      </div>

      <Card title = "Management">
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button 
              key={tab} onClick={() => setActiveTab(tab)}
              className= {`flex-1 px-4 py-2 text-sm font-medium ${activeTab == tab ? "bg-gray-800 text-white border" : "bg-gray-900 text-gray-400 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>  
        

        {activeTab == tabs[1] && <BuySellStock leagueMemberId={leagueMemberId} />}
        {activeTab == tabs[2] && <Portfolio leagueMemberId={leagueMemberId} />}
      </Card>

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
