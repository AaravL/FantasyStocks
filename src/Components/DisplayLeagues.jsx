import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DisplayLeagues = ({ userId, refreshKey }) => {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data, count, error: countError } = await supabase
          .from('league_members')
          .select('league_id, leagues(name)', { count: 'exact' })
          .eq('user_id', userId);
        setCount(count);
        setError(countError);
        setLeagues(data || []);
        setIndex(0);
      } catch (err) {
        setError(err);
      }
    };
    fetchCount();
  }, [userId, refreshKey]);

  const nextInd = () => {
    if (leagues.length > 0) {
      setIndex((index + 1) % count);
    }
  };

  const goToLeague = () => {
    if (leagues.length > 0) {
      navigate(`/league/${leagues[index]?.league_id}`);
    }
  };

  return (
    <div className="flex flex-col justify-between items-center w-[300px] h-[180px] bg-[#1f1f1f] p-4 rounded-xl border border-gray-700 text-white">
      <div className="mb-4 text-left w-full">
        <h3 className="text-lg font-semibold mb-2">Your Leagues</h3>
        <button
  onClick={goToLeague}
  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
>
  League: {leagues[index]?.leagues?.name || "Cannot retrieve"}
</button>

      </div>
  
      <button
  onClick={nextInd}
  className="border border-white text-white hover:bg-white hover:text-white transition-all duration-200 rounded px-4 py-1 mt-auto"
>
  Next League
</button>



  
      {error && <div className="text-red-500 mt-2">Error: {error.message}</div>}
    </div>
  );

};

export default DisplayLeagues;
