import React, { useEffect, useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LeagueCreation } from './LeagueCreation';
import JoinLeague from './JoinLeague.jsx';
import DisplayLeagues from './DisplayLeagues.jsx';
import Card from './Card.jsx';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(prev => (prev + 1) % 2);

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
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-black to-gray-900 flex justify-center items-start px-4 py-12">
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg border border-gray-700 shadow-2xl rounded-xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-wide mb-2">
            Your Dashboard
          </h1>
          {loading ? (
            <p className="text-gray-300">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <h2 className="text-xl text-indigo-300 font-medium">
              Welcome, {displayName}!
            </h2>
          )}
          <p className="text-gray-400 text-sm mt-2">
            Manage leagues, view standings, and dominate the market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card title="Select League">
            <DisplayLeagues userId={session?.user?.id} refreshKey={refreshKey} />
          </Card>

          <Card title="League Creation">
            <LeagueCreation userId={session?.user?.id} onEdit={refresh} />
            <JoinLeague userId={session?.user?.id} onEdit={refresh} />
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleSignOut}
            className="text-white font-medium border border-indigo-500 hover:bg-indigo-600 hover:border-indigo-600 px-6 py-2 rounded-lg transition duration-300"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
