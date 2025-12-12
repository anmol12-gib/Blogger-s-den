import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { handleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const result = await loginUser({ emailOrUsername, password });
      handleLogin(result);

      // if user came from a protected page (like /posts/new), go back there
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Log in</h1>
        <p>Sign in to continue writing and managing your posts.</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <form className="post-form" onSubmit={onSubmit}>
        <label>
          Email or Username
          <input
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder="you@example.com or username"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </button>

        <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)" }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
