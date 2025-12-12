import React from "react";
import { Link } from "react-router-dom";

export default function AuthorCard({ author }) {
  // author: { id, username, bio, avatarUrl, postsCount }
  const avatar = author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=2c2f33&color=ffffff&size=64`;

  return (
    <div className="global-card" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <div style={{ width: 84, flex: "0 0 84px" }}>
        <img src={avatar} alt={author.username} style={{ width: 84, height: 84, borderRadius: 12, objectFit: "cover", border: "1px solid rgba(255,255,255,0.04)" }} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
          <Link to={`/authors/${author._id || author.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            {author.username}
          </Link>
        </h3>
        <p style={{ margin: "6px 0", color: "var(--muted)" }}>{author.bio ? (author.bio.length > 140 ? author.bio.slice(0, 140) + "..." : author.bio) : "No bio yet."}</p>
        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          {author.postsCount ?? 0} posts • Member since {new Date(author.createdAt || author._id?.toString?.()?.slice(0,8) || Date.now()).toLocaleDateString()}
        </div>
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <Link to={`/authors/${author._id || author.id}`} className="primary-btn-ghost">View</Link>
      </div>
    </div>
  );
}
