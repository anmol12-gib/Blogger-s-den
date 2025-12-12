import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";   // ⬅ added Link here
import { registerUser } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // 🔐 Password rule (same as shown in the hint)
    const passwordRule =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!passwordRule.test(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
      );
      return; // stop here, don't call API
    }

    try {
      setLoading(true);
      const result = await registerUser({ username, email, password });
      handleLogin(result);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Create an Account</h1>
        <p>Sign up to start publishing your own posts.</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <form className="post-form" onSubmit={onSubmit}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* PASSWORD HINT */}
          <p className="password-hint">
            Password must contain:
            <br />• Minimum 8 characters
            <br />• At least 1 uppercase (A–Z)
            <br />• At least 1 lowercase (a–z)
            <br />• At least 1 number (0–9)
            <br />• At least 1 special character (! @ # $ % etc.)
          </p>
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </button>

        <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)" }}>
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
