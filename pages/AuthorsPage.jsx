import React, { useEffect, useState } from "react";
import { fetchAuthors } from "../api.js";
import AuthorCard from "../components/AuthorCard.jsx";

export default function AuthorsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [authors, setAuthors] = useState([]);
  const [status, setStatus] = useState("idle");
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        const res = await fetchAuthors({ q, page, limit: 12 });
        setAuthors(res.items || []);
        setTotalPages(res.totalPages || 1);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    load();
  }, [q, page]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Authors</h1>
          <p>Discover writers and creators from around the world.</p>
        </div>
      </div>

      <div style={{ margin: "1rem 0 1.25rem", display: "flex", gap: ".75rem", alignItems: "center" }}>
        <input placeholder="Search authors..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ padding: ".5rem .75rem", borderRadius: 999, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" }} />
      </div>

      {status === "loading" && <div className="loader"><div className="spinner"></div>Loading authors...</div>}
      {status === "error" && <div className="error-message">Failed to load authors</div>}

      {status === "success" && authors.length === 0 && <div className="empty-state">No authors found.</div>}

      <div className="authors-grid" style={{ marginTop: ".5rem" }}>
        {authors.map((a) => <AuthorCard key={a._id || a.id} author={a} />)}
      </div>

      {/* simple pagination controls */}
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: ".5rem" }}>
        <button className="primary-btn-ghost" disabled={page <= 1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <div style={{ alignSelf: "center", color: "var(--muted)" }}>Page {page} / {totalPages}</div>
        <button className="primary-btn-ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
      </div>
    </div>
  );
}
