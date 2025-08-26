import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSignInError(error.message);
    } else {
      setSignInError(null);
      navigate("/dashboard"); // or home page
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md border border-gray-600 rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-wide mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-300 text-sm font-light">
            Sign in to continue your fantasy trading journey.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-md font-semibold transition duration-200"
          >
            Sign In
          </button>

          {signInError && (
            <p className="text-red-400 text-sm text-center mt-2">{signInError}</p>
          )}
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don’t have an account?{" "}
          <a href="/signup" className="text-indigo-400 hover:underline font-medium">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
