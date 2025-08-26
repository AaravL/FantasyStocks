import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const LeaderboardPage = ({ leagueId }) => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: members, error: memberError } = await supabase
        .from("league_members")
        .select("league_member_id")
        .eq("league_id", leagueId);

      if (memberError) return console.error("Error fetching league members:", memberError);
      if (!members || members.length === 0) return;

      const leagueMemberIds = members.map((m) => m.league_member_id);

      const { data: matchups, error: matchupError } = await supabase
        .from("matchups")
        .select("user1_id, user2_id, winner_id")
        .eq("league_id", leagueId);

      if (matchupError) return console.error("Error fetching matchups:", matchupError);
      if (!matchups || matchups.length === 0) return;

      const playerStats = {};

      for (const m of matchups) {
        const players = [m.user1_id, m.user2_id];
        for (const pid of players) {
          if (!leagueMemberIds.includes(pid)) continue;
          if (!playerStats[pid]) playerStats[pid] = { wins: 0, total: 0 };
          playerStats[pid].total++;
        }

        if (m.winner_id && leagueMemberIds.includes(m.winner_id)) {
          if (!playerStats[m.winner_id]) playerStats[m.winner_id] = { wins: 0, total: 0 };
          playerStats[m.winner_id].wins++;
        }
      }

      const leaderboardData = Object.entries(playerStats).map(
        ([user_id, { wins, total }]) => ({
          user_id,
          wins,
          total,
          winRate: total > 0 ? (wins / total) * 100 : 0,
        })
      );

      leaderboardData.sort((a, b) => b.winRate - a.winRate);
      setStats(leaderboardData);
    };

    fetchLeaderboard();
  }, [leagueId]);

  return (
    <div className="bg-gradient-to-br from-black via-zinc-900 to-black min-h-screen px-6 py-10 text-white rounded-xl">
      <div className="max-w-4xl mx-auto bg-zinc-900 rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">
          📊 Leaderboard
        </h1>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-zinc-800">
            <thead>
              <tr className="bg-zinc-800 text-blue-300">
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider border border-zinc-700">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider border border-zinc-700">User ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider border border-zinc-700">Wins</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider border border-zinc-700">Games Played</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider border border-zinc-700">Win %</th>
              </tr>
            </thead>
            <tbody className="bg-zinc-950">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-400 border border-zinc-700">
                    No matchups found.
                  </td>
                </tr>
              ) : (
                stats.map((stat, index) => (
                  <tr key={stat.user_id} className="hover:bg-zinc-800 transition">
                    <td className="px-6 py-4 border border-zinc-700">{index + 1}</td>
                    <td className="px-6 py-4 border border-zinc-700 text-blue-300">{stat.user_id}</td>
                    <td className="px-6 py-4 border border-zinc-700">{stat.wins}</td>
                    <td className="px-6 py-4 border border-zinc-700">{stat.total}</td>
                    <td className={`px-6 py-4 border border-zinc-700 font-medium ${
                      stat.winRate === 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {stat.winRate.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
