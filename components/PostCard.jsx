import React from "react";
import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <header>
        <h2>
          <Link to={`/posts/${post._id}`}>{post.title}</Link>
        </h2>
        <p className="post-meta">
          By {post.author || "Anonymous"} ·{" "}
          {new Date(post.createdAt).toLocaleString()}
        </p>
      </header>
      <p className="post-excerpt">{post.excerpt}</p>
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <Link to={`/posts/${post._id}`} className="post-read-more">
        Read more →
      </Link>
    </article>
  );
}
