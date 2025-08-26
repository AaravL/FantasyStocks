import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

function useQueryParamWeek() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  return useMemo(() => {
    try {
      const u = new URLSearchParams(search);
      const w = u.get('week');
      return w ? parseInt(w, 10) : null;
    } catch {
      return null;
    }
  }, [search]);
}

export default function MatchupPage({ leagueId = null }) {
  const [weeks, setWeeks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [matchups, setMatchups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(false);
  const [error, setError] = useState(null);

  const urlWeek = useQueryParamWeek();

  useEffect(() => {
    let isMounted = true;

    const fetchWeeksAndChooseCurrent = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('matchups')
          .select('id, week, league_id, user1_id, user2_id, u1_score, u2_score')
          .order('id', { ascending: true });

        if (leagueId) query = query.eq('league_id', leagueId);

        const { data: allRows, error: weeksErr } = await query;
        if (weeksErr) throw weeksErr;

        const distinctWeeks = [...new Set((allRows || []).map(r => r.week))].filter(Number.isInteger);
        if (isMounted) setWeeks(distinctWeeks);

        let chosenWeek = null;
        if (urlWeek && distinctWeeks.includes(urlWeek)) {
          chosenWeek = urlWeek;
        } else {
          const weekWithNull = distinctWeeks.find(w =>
            allRows.some(r => r.week === w && (r.u1_score === null || r.u2_score === null))
          );
          chosenWeek = weekWithNull ?? Math.max(...distinctWeeks);
        }

        if (isMounted) setCurrentWeek(chosenWeek ?? null);
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load weeks');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeeksAndChooseCurrent();
    return () => { isMounted = false };
  }, [leagueId, urlWeek]);

  useEffect(() => {
    if (currentWeek == null) return;

    let isMounted = true;

    const fetchMatchupsAndPortfolioValues = async () => {
      setWeekLoading(true);
      setError(null);
      try {
        // Step 1: Get matchups for the current week and league
        let q = supabase
          .from('matchups')
          .select('id, league_id, week, user1_id, user2_id')
          .eq('week', currentWeek)
          .order('id', { ascending: true });

        if (leagueId) q = q.eq('league_id', leagueId);

        const { data: matchData, error: matchErr } = await q;
        if (matchErr) throw matchErr;

        const allUserIds = Array.from(
          new Set(matchData.flatMap(m => [m.user1_id, m.user2_id]))
        );

        // Step 2: Get portfolios
        const { data: portfolioData, error: portErr } = await supabase
          .from('portfolios')
          .select('league_member_id, start_of_week_total, current_balance')
          .in('league_member_id', allUserIds);

        if (portErr) throw portErr;

        const portfoliosById = Object.fromEntries(
          (portfolioData || []).map(p => [p.league_member_id, p])
        );

        // Step 3: Get holdings
        const { data: holdingsData, error: holdErr } = await supabase
          .from('holdings')
          .select('league_member_id, ticker, stock_amount')
          .in('league_member_id', allUserIds);

        if (holdErr) throw holdErr;

        // Step 4: Get unique tickers
        const uniqueTickers = Array.from(new Set((holdingsData || []).map(h => h.ticker)));

        const { data: pricesData, error: priceErr } = await supabase
          .from('stock_prices')
          .select('symbol, close, timestamp')
          .in('symbol', uniqueTickers)
          .order('timestamp', { ascending: false });

        if (priceErr) throw priceErr;

        const latestPrices = {};
        for (const row of pricesData) {
          if (!(row.symbol in latestPrices)) {
            latestPrices[row.symbol] = row.close;
          }
        }

        // Step 5: Calculate scores
        const userEffectiveBalances = {};
        for (const userId of allUserIds) {
          const port = portfoliosById[userId];
          if (!port) continue;

          const holdings = holdingsData.filter(h => h.league_member_id === userId);
          const holdingValue = holdings.reduce((sum, h) => {
            const price = latestPrices[h.ticker] ?? 0;
            return sum + h.stock_amount * price;
          }, 0);

          userEffectiveBalances[userId] = {
            percent:
              port.start_of_week_total > 0
                ? ((port.current_balance + holdingValue - port.start_of_week_total) /
                    port.start_of_week_total) *
                  100
                : 0
          };
        }

        // Step 6: Attach scores to matchups
        const enrichedMatchups = matchData.map(m => ({
          ...m,
          u1_score: userEffectiveBalances[m.user1_id]?.percent.toFixed(2) ?? '',
          u2_score: userEffectiveBalances[m.user2_id]?.percent.toFixed(2) ?? ''
        }));

        if (isMounted) setMatchups(enrichedMatchups);
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load matchups');
      } finally {
        if (isMounted) setWeekLoading(false);
      }
    };

    fetchMatchupsAndPortfolioValues();
    return () => { isMounted = false };
  }, [currentWeek, leagueId]);

  return (
    <div className="matchups-page p-4">
      <h2 className="text-lg font-semibold mb-2">Matchups</h2>

      <div className="flex items-center gap-4 mb-4">
        <div><strong>Week:</strong> {currentWeek ?? '—'}</div>
        <label>
          <span>Go to week: </span>
          <select value={currentWeek ?? ''} onChange={e => setCurrentWeek(parseInt(e.target.value, 10))}>
            <option value="" disabled>Select week</option>
            {weeks.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p>Loading weeks…</p> :
        error ? <p className="text-red-600">{error}</p> :
          currentWeek == null ? <p>No weeks found. Generate matchups first.</p> :
            weekLoading ? <p>Loading matchups…</p> :
              matchups.length === 0 ? <p>No matchups for week {currentWeek}</p> :
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border-b">User A ID</th>
                        <th className="px-2 py-2 border-b">vs</th>
                        <th className="px-4 py-2 border-b">User B ID</th>
                        <th className="px-4 py-2 border-b">A Score (%)</th>
                        <th className="px-4 py-2 border-b">B Score (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchups.map(m => (
                        <tr key={m.id}>
                          <td className="px-4 py-2 border-b">{m.user1_id ?? '—'}</td>
                          <td className="px-2 py-2 border-b text-center">vs</td>
                          <td className="px-4 py-2 border-b">{m.user2_id ?? '—'}</td>
                          <td className="px-4 py-2 border-b text-right">{m.u1_score}%</td>
                          <td className="px-4 py-2 border-b text-right">{m.u2_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
    </div>
  );
}
