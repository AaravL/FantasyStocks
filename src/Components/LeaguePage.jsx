import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { ChatContextProvider } from "../context/ChatContext.jsx";
import BuySellStock from "./Stocks/BuySellStock";
import Portfolio from "./Stocks/Portfolio";
import AddDropStock from "./AddDropStock";
import LeaderboardPage from "./LeaderboardPage";
import ChatWindow from "./ChatWindow";
import { generateMatchups } from "./matchups";
import Card from "./Card.jsx";
import MatchupPage from "./matchupPage";

const tabs = ["Matchup", "Buy/Sell Stock", "Portfolio", "View Leaderboard", "Add/Drop Stock", "Chat Window"];

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
      const { data, error } = await supabase
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

      setLeagueMemberId(data.league_member_id);
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

  const calculateMatchups = async () => {
    try {
      const response = await fetch("http://localhost:8000/run-matchups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error("Error calculating matchups:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6 pt-24">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-2">🏆 {leagueName}</h1>
        <p className="text-center text-gray-400 mb-8">League Code: {leagueCode}</p>

        {/* Side-by-side Member List and Display Name Form */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">

          {/* League Members List Card */}
          <div className="bg-gray-900 rounded-2xl p-6 w-full lg:w-1/2 shadow border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">League Members</h2>
            {error && <p className="text-red-500">{error}</p>}
            <ul className="space-y-2">
              {members.length === 0 ? (
                <p className="text-gray-400">No members in this league.</p>
              ) : (
                members.map((member) => (
                  <li key={member.user_id} className="text-gray-300">
                    {member.display_name || member.user_id}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Display Name Update Form */}
          <div className="bg-gray-900 rounded-2xl p-6 w-full lg:w-1/2 shadow border border-gray-800">
            <h3 className="text-2xl font-semibold mb-4">Change League Display Name</h3>
            <form onSubmit={handleDisplayNameChange} className="space-y-4">
              <input
                type="text"
                placeholder="New Display Name"
                value={newLeagueDisplayName}
                onChange={(e) => setNewLeagueDisplayName(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition w-full"
              >
                Update Display Name
              </button>
              {updateMessage && (
                <p className="text-sm text-blue-400">{updateMessage}</p>
              )}
            </form>
          </div>
        </div>

        {/* Matchup Button */}
        <div className="text-center mb-10">
          <button
            onClick={() => {
              handleGenerateMatchups();
              calculateMatchups();
            }}
            disabled={matchupLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded disabled:opacity-50 transition"
          >
            {matchupLoading ? "Generating Matchups..." : "Generate Matchups"}
          </button>
          {matchupStatus && (
            <p className="mt-2 text-sm text-gray-400">{matchupStatus}</p>
          )}
        </div>

        <Card title="League Management">
          <div className="flex flex-wrap border-b border-gray-700 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition ${activeTab === tab
                    ? "bg-gray-800 text-white border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === tabs[0] && <MatchupPage leagueId={leagueId} />}
            {activeTab == tabs[1] && <BuySellStock leagueMemberId={leagueMemberId} />}
            {activeTab == tabs[2] && <Portfolio leagueMemberId={leagueMemberId} />}
            {activeTab == tabs[3] && <LeaderboardPage leagueId={leagueId} />}
            {activeTab === tabs[4] && (
              <AddDropStock leagueId={leagueId} userId={userId} leagueMemberId={leagueMemberId} members = {members}/>
            )}
            {activeTab === tabs[5] &&
              <ChatContextProvider leagueId={leagueId} userId={userId} members={members}>
                <ChatWindow />
              </ChatContextProvider>
            }
          </div>
        </Card>

        <div className="text-center mt-10">
          <button
            onClick={handleBackToDashboard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;
