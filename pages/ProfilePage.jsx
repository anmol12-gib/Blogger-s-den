import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchMyProfile } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import PostCard from "../components/PostCard.jsx";

export default function ProfilePage() {
  const { user, handleLogout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    async function load() {
      try {
        setStatus("loading");
        setError("");
        const data = await fetchMyProfile();
        setProfile(data);
        setStatus("success");
      } catch (err) {
        setError(err.message || "Failed to load profile");
        setStatus("error");
      }
    }
    load();
  }, [user, navigate]);

  function onLogout() {
    handleLogout();
    navigate("/");
  }

  if (!user) return null;
  if (status === "loading") return <Loader />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Account</h1>
          <p>View your details and posts.</p>
        </div>
        <button className="profile-logout-btn" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {status === "error" && <ErrorMessage message={error} />}

      {profile && (
        <>
          <section className="profile-section">
            <div className="profile-avatar">
              {profile.user.username[0]?.toUpperCase()}
            </div>
            <div>
              <h2>{profile.user.username}</h2>
              <p className="post-meta">{profile.user.email}</p>
              <p className="post-meta">
                Member since{" "}
                {new Date(profile.user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </section>

          <section className="profile-posts">
            <div className="profile-posts-header">
                <div className="profile-posts-left">
                  <h2>My Posts</h2>
                  <p className="profile-sub">You haven't written any posts yet.</p>
                </div>

                <div className="profile-posts-right">
                  <Link to="/posts/new" className="page-cta small-cta">
                    + New Post
                  </Link>
                </div>
            </div>
            
            {profile.posts.length === 0 ? (
              <p className="empty-state">
                You haven&apos;t written any posts yet.
              </p>
            ) : (
              <div className="post-list">
                {profile.posts.map((p) => (
                  <PostCard key={p._id} post={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
