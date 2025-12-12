import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchAuthor, fetchAuthorPosts } from "../api.js";

export default function AuthorPage() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        const [aRes, pRes] = await Promise.all([fetchAuthor(id), fetchAuthorPosts(id, { page:1, limit:20 })]);
        setAuthor(aRes);
        setPosts(pRes.items || []);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    load();
  }, [id]);

  if (status === "loading") return <div className="page"><div className="loader"><div className="spinner"></div>Loading...</div></div>;
  if (status === "error") return <div className="page"><div className="error-message">Author not found or failed to load</div></div>;

  const avatar = author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=2c2f33&color=ffffff&size=128`;

  return (
    <div className="page">
      <div style={{ display:"flex", gap:"1rem", alignItems:"center", marginBottom:"1rem" }}>
        <img src={avatar} alt={author.username} style={{ width:96, height:96, borderRadius:12, objectFit:"cover" }} />
        <div>
          <h1 style={{ margin:0 }}>{author.username}</h1>
          <div style={{ color:"var(--muted)" }}>{author.location || ""} • Joined {new Date(author.createdAt).toLocaleDateString()}</div>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <Link to={`/authors/${id}/posts`} className="primary-btn-ghost">View all posts</Link>
        </div>
      </div>

      {author.bio && <div style={{ marginBottom: "1rem", color:"var(--text)" }}>{author.bio}</div>}

      <h3 style={{ marginTop: "1rem" }}>Latest posts</h3>
      <div className="post-list">
        {posts.length === 0 && <div className="empty-state">No posts yet.</div>}
        {posts.map(p => (
          <div className="post-card" key={p._id || p.id}>
            <h2><Link to={`/posts/${p._id || p.id}`}>{p.title}</Link></h2>
            <div className="post-meta">By {p.authorName} • {new Date(p.createdAt).toLocaleDateString()}</div>
            <p className="post-excerpt">{p.excerpt || (p.content ? p.content.slice(0,140)+"..." : "")}</p>
            <Link to={`/posts/${p._id || p.id}`} className="read-more">Read full article →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
