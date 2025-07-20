import React from 'react'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';


const Signup = () => {
  const[email, setEmail] = useState("");
  const[password, setPassword] = useState("");
  const[error, setError] = useState("");
  const[loading, setLoading] = useState("");

  const {session, signUpNewUser} = UserAuth();
  const navigate = useNavigate();
  console.log(session);

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true);
    try{
      const result = await signUpNewUser(email, password)
      if(result.success) {
        navigate('/create-profile');
      } 
    } catch(error) {
      setError("an error occured");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSignup} className = "max-w-md m-auto pt-24"> 
        <h2 className = "font-bold pb-2">Signup Today!</h2>
        <p>Already have an account? <Link to= "/signin">Sign in!</Link></p>
        <div>
          <input onChange= {(e) => setEmail(e.target.value)}
          placeholder = "Email" type = "email" />
          <input onChange = {(e) => setPassword(e.target.value)}
          placeholder = "Password" type = "password" />
          <button type = "submit" disabled = {loading}>Sign up</button>
          {error && <p className = "text-red-600 text-center pt-4">{error}</p>}
        </div>
      </form>
    </div>
  )
}

export default Signup
