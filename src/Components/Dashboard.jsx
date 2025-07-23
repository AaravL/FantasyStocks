import React, { useEffect, useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LeagueCreation } from './LeagueCreation';
import JoinLeague from './JoinLeague.jsx';
import DisplayLeagues from './DisplayLeagues.jsx';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch display_name from "profiles" table
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching display name:', error.message);
          setError('Failed to load display name.');
        } else {
          setDisplayName(data.display_name);
        }
        setLoading(false);
      }
    };

    fetchDisplayName();
  }, [session]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <h2 className="text-xl mb-4">Welcome, {displayName}!</h2>
      )}

      <p className="text-gray-500 mb-2">
        This is your dashboard where you can manage your account and leagues.
      </p>
      <p className="text-gray-500 mb-4">
        You can create leagues, join leagues, and view your league standings.
      </p>

      <LeagueCreation userId={session?.user?.id} />
      <JoinLeague userId={session?.user?.id} />

      <DisplayLeagues  userId={session?.user?.id} />

      <div>
        <p
          onClick={handleSignOut}
          className="hover:cursor-pointer border inline-block px-4 py-3 mt-4"
        >
          Sign out
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
