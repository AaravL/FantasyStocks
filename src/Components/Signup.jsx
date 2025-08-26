import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpError, setSignUpError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setSignUpError(error.message);
    } else {
      setSignUpError(null);
      navigate("/dashboard"); // or confirmation page
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md border border-gray-600 rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Logo + Title */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-wide mb-2">
            Fantasy<span className="text-indigo-400">Stocks</span>
          </h1>
          <p className="text-gray-300 text-sm font-light">
            Sign up and start trading with your league.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-5">
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
            Create Account
          </button>

          {signUpError && (
            <p className="text-red-400 text-sm text-center mt-2">{signUpError}</p>
          )}
        </form>

        {/* Already have account */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <a
            href="/signin"
            className="text-indigo-400 hover:underline font-medium"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
