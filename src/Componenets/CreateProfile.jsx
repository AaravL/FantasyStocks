import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const CreateProfile = () => {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { session } = UserAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError("Display name cannot be empty.");
      return;
    }

    const { user } = session;

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, display_name: displayName },
        { onConflict: "id" } // ensures it updates if profile already exists
      );

    if (upsertError) {
      setError(upsertError.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto pt-24">
      <h2 className="text-2xl font-bold mb-4">Create Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-3 border rounded"
        />
        {error && <p className="text-red-600 mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Save and Go to Dashboard
        </button>
      </form>
    </div>
  );
};

export default CreateProfile;
