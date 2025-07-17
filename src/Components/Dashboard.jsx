import React from 'react'
import {UserAuth} from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom';
import { LeagueCreation } from './LeagueCreation.jsx';
import JoinLeague from './JoinLeague.jsx';
import DisplayLeagues from './DisplayLeagues.jsx';

const Dashboard = () => {
  const {session, signOut}  = UserAuth();
  const navigate = useNavigate();

  console.log(session);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try{
      await signOut();
      navigate('/');
    } catch(err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      <div>
        <p className="text-gray-500">This is your dashboard where you can manage your account and leagues.</p>
        <p className="text-gray-500">You can create leagues, join leagues, and view your league standings.</p>

        <LeagueCreation userId={session?.user?.id} />

        <JoinLeague userId={session?.user?.id} />

        <DisplayLeagues userId={session?.user?.id} />
      </div>
      <div>
        <p 
          onClick = {handleSignOut}
          className = "hover:cursor-pointer border inline-block px-4 py-3 mt-4">Sign out</p>
      </div>
    </div>
  )
}

export default Dashboard