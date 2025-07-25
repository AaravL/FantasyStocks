import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';

/**
 * Generates head-to-head matchups for a given league using round-robin logic.
 * Each player plays once per week. If odd number of players, one gets a rest week.
 */
export const generateMatchups = async (leagueId, setStatus, setLoading) => {
  setLoading(true);
  setStatus("Generating matchups...");

  try {
    // Step 1: Get all members of the league
    const { data: members, error: memberError } = await supabase
      .from("league_members")
      .select("league_member_id")
      .eq("league_id", leagueId);

    if (memberError) throw memberError;
    if (!members || members.length < 2) {
      setStatus("Not enough members to generate matchups.");
      setLoading(false);
      return;
    }

    // Step 2: Get all portfolio performances
    const { data: portfolios, error: portfolioError } = await supabase
      .from("portfolios")
      .select("league_member_id, start_of_week_total, current_balance");

    if (portfolioError) throw portfolioError;

    // Build performance lookup
    const performanceMap = {};
    for (const p of portfolios) {
      if (p.start_of_week_total > 0) {
        performanceMap[p.league_member_id] =
          (p.current_balance - p.start_of_week_total) / p.start_of_week_total;
      }
    }

    // Step 3: Round-robin matchup scheduling
    const matchupsToInsert = [];
    let week = 1;
    const usedInWeek = new Set();

    // Clone member list to avoid mutation
    const players = [...members];

    // Total unique pairings = nC2
    const scheduledPairs = new Set();

    const totalPairs = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        totalPairs.push([players[i], players[j]]);
      }
    }

    // Shuffle the pairings for randomness
    for (let i = totalPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [totalPairs[i], totalPairs[j]] = [totalPairs[j], totalPairs[i]];
    }

    for (const [p1, p2] of totalPairs) {
      const id1 = p1.league_member_id;
      const id2 = p2.league_member_id;

      // If either already used this week, start new week
      if (usedInWeek.has(id1) || usedInWeek.has(id2)) {
        usedInWeek.clear();
        week++;
      }

      const perf1 = performanceMap[id1] ?? null;
      const perf2 = performanceMap[id2] ?? null;

      let winner = null;
      if (perf1 != null && perf2 != null) {
        if (perf1 > perf2) winner = id1;
        else if (perf2 > perf1) winner = id2;
      }

      matchupsToInsert.push({
        week,
        user1_id: id1,
        user2_id: id2,
        u1_score: perf1,
        u2_score: perf2,
        winner_id: winner,
      });

      usedInWeek.add(id1);
      usedInWeek.add(id2);
    }

    // Handle rest week matchups (optional)
    const allPlayers = players.map((m) => m.league_member_id);
    const pairedSet = new Set(
      matchupsToInsert.flatMap((m) => [m.user1_id, m.user2_id])
    );

    const unpaired = allPlayers.filter((id) => !pairedSet.has(id));
    for (const loneId of unpaired) {
      matchupsToInsert.push({
        week: week,
        user1_id: loneId,
        user2_id: null,
        u1_score: null,
        u2_score: null,
        winner_id: loneId, // could be null or mark as auto-win
      });
    }

    // Step 4: Insert matchups into DB
    const { error: insertError } = await supabase
      .from("matchups")
      .insert(matchupsToInsert);

    if (insertError) throw insertError;

    setStatus("✅ Matchups generated and saved!");
  } catch (err) {
    console.error(err);
    setStatus(`❌ Error: ${err.message}`);
  }

  setLoading(false);
};
