import React from 'react'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';


const Signin = () => {
  const[email, setEmail] = useState("");
  const[password, setPassword] = useState("");
  const[error, setError] = useState("");
  const[loading, setLoading] = useState("");

  const {session, signInUser} = UserAuth();
  const navigate = useNavigate();
  console.log(session);

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true);
    try{
      const result = await signInUser(email, password)
      if(result.success) {
        navigate('/dashboard')
      } 
    } catch(error) {
      setError("an error occured");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSignIn} className = "max-w-md m-auto pt-24"> 
        <h2 className = "font-bold pb-2">Sign in</h2>
        <p>Don't have an account? <Link to= "/signup">Sign up!</Link></p>
        <div>
          <input onChange= {(e) => setEmail(e.target.value)}
          placeholder = "Email" type = "email" />
          <input onChange = {(e) => setPassword(e.target.value)}
          placeholder = "Password" type = "password" />
          <button type = "submit" disabled = {loading}>Sign in</button>
          {error && <p className = "text-red-600 text-center pt-4">{error}</p>}
        </div>
      </form>
    </div>
  )
}

export default Signin