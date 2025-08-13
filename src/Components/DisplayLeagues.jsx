import React, { useState, useEffect, use } from 'react';
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
                const {data, count, error: countError } = await supabase
                    .from('league_members')
                    .select('league_id, leagues(name)', { count: 'exact'})
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
        console.log(leagues);
        console.log(index);
        if (leagues.length > 0) {
            setIndex((index+1) % count);
        }
    }

    const goToLeague = () => {
        if (leagues.length > 0) {
            navigate(`/league/${leagues[index]?.league_id}`);
        }
    }

    return (
        <div>
            <div>League count: {count !== null ? count : 'Loading...'}</div>
            {count === 0 && (
                <p>You are not part of any leagues. Join or create a league to get started!</p>
            )}
            {count > 0 && (
                <div>
                    <button onClick = {goToLeague}>League Name : {leagues[index]?.leagues?.name || "cannot retrieve"}</button>
                    <button onClick={nextInd}>Next League</button>
                </div>
            )}

            {error && <div>Error: {error.message}</div>}

        </div>
    );
};

export default DisplayLeagues;