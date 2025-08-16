import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const LeaderboardPage = ({leagueId}) => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      
      console.log("🔍 Fetching leaderboard for League ID:", leagueId);

      // 1. Fetch all league members in this league
      const { data: members, error: memberError } = await supabase
        .from("league_members")
        .select("league_member_id")
        .eq("league_id", leagueId);

      if (memberError) {
        console.error("❌ Error fetching league members:", memberError);
        return;
      }

      if (!members || members.length === 0) {
        console.warn("⚠️ No members found for league:", leagueId);
        return;
      }

      const leagueMemberIds = members.map((m) => m.league_member_id);
      console.log("✅ League Members:", leagueMemberIds);

      // 2. Fetch matchups that belong to this league
      const { data: matchups, error: matchupError } = await supabase
        .from("matchups")
        .select("user1_id, user2_id, winner_id")
        .eq("league_id", leagueId);

      if (matchupError) {
        console.error("❌ Error fetching matchups:", matchupError);
        return;
      }

      console.log(`✅ Matchups fetched (${matchups.length}):`, matchups.slice(0, 3));

      if (!matchups || matchups.length === 0) {
        console.warn("⚠️ No matchups found for league:", leagueId);
        return;
      }

      // 3. Process player stats
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
      console.log("📊 Final Leaderboard:", leaderboardData);

      setStats(leaderboardData);
    };

    fetchLeaderboard();
  }, [leagueId]);

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <table className="mx-auto text-left border border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Rank</th>
            <th className="border px-4 py-2">User ID</th>
            <th className="border px-4 py-2">Wins</th>
            <th className="border px-4 py-2">Games Played</th>
            <th className="border px-4 py-2">Win %</th>
          </tr>
        </thead>
        <tbody>
          {stats.length === 0 ? (
            <tr>
              <td colSpan="5" className="border px-4 py-2 text-center">
                No matchups found.
              </td>
            </tr>
          ) : (
            stats.map((stat, index) => (
              <tr key={stat.user_id}>
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{stat.user_id}</td>
                <td className="border px-4 py-2">{stat.wins}</td>
                <td className="border px-4 py-2">{stat.total}</td>
                <td className="border px-4 py-2">
                  {stat.winRate.toFixed(2)}%
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardPage;
