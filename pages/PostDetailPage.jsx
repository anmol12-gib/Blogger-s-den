import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchPost, deletePost } from "../api.js";
import Loader from "../components/Loader.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        setError("");
        const data = await fetchPost(id);
        setPost(data);
        setStatus("success");
      } catch (err) {
        setError(err.message || "Failed to load the post.");
        setStatus("error");
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(id);
      navigate("/");
    } catch (err) {
      alert(err.message || "Failed to delete post.");
    }
  }

  if (status === "loading") return <Loader />;
  if (status === "error")
    return (
      <div className="page">
        <ErrorMessage message={error} />
        <Link to="/" className="link-btn">
          ← Back to feed
        </Link>
      </div>
    );
  if (!post) return null;

  return (
    <div className="page">
      <article className="post-detail">
        <header>
          <h1>{post.title}</h1>
          <p className="post-meta">
            By {post.author || "Anonymous"} ·{" "}
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </header>

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <section className="post-content">
          {post.content.split("\n").map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </section>

        <div className="post-detail-actions">
          <Link to={`/posts/${post._id}/edit`} className="primary-btn">
            Edit Post
          </Link>
          <button className="delete-btn" onClick={handleDelete}>
            Delete
          </button>

          <Link to="/" className="link-btn">
            ← Back to feed
          </Link>
        </div>
      </article>
    </div>
  );
}
