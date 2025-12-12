import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/?q=${encodeURIComponent(trimmed)}`);
    else navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* Left Logo */}
        <Link to="/" className="logo">
          <span className="logo-text">BLOGGER'S DEN</span>
        </Link>

        {/* Middle navigation */}
        <div className="navbar-middle">
          <nav className="nav-links">
            <NavLink to="/" end>Home</NavLink>
           
            <NavLink to="/posts/new">Create</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>

        {/* Right: Search + Theme + Profile */}
        <div className="navbar-right">
          <form className="search-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {/* Theme toggle */}
          <button
            type="button"
            className="link-btn"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {/* Account icon (different for logged in vs logged out) */}
          {user ? (
            <button
              type="button"
              className="profile-icon-btn"
              onClick={() => navigate("/profile")}
            >
              <span className="profile-icon-circle">
                {user.username?.[0]?.toUpperCase() || "U"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="profile-icon-btn"
              onClick={() => navigate("/login")}
            >
              <span className="profile-icon-circle">👤</span>
            </button>
          )}
        </div>


      </div>
    </header>

  );
}
