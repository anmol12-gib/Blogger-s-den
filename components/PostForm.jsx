import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function PostForm({ initialValue, onSubmit, submitLabel }) {
  const [title, setTitle] = useState(initialValue?.title || "");
  const [author, setAuthor] = useState(initialValue?.author || "");
  const [content, setContent] = useState(initialValue?.content || "");
  const [showPreview, setShowPreview] = useState(false);
  const [tags, setTags] = useState(
    initialValue?.tags ? initialValue.tags.join(", ") : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setTitle(initialValue.title || "");
      setAuthor(initialValue.author || "");
      setContent(initialValue.content || "");
      setTags(initialValue.tags ? initialValue.tags.join(", ") : "");
    }
  }, [initialValue]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      author: author.trim() || "Anonymous",
      content: content.trim(),
      tags: tagsArray,
    });
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}

      <label>
        Title <span className="required">*</span>
        <input
          type="text"
          placeholder="Enter a catchy title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label>
        Author
        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </label>

      <label>
  Content <span className="required">*</span>
  <textarea
    rows={12}
    placeholder="Write your article here. Supports markdown (## headings, **bold**, etc.)"
    value={content}
    onChange={(e) => setContent(e.target.value)}
  />
</label>

<div style={{ marginTop: "0.5rem" }}>
  <button
    type="button"
    className="link-btn"
    onClick={() => setShowPreview((p) => !p)}
  >
    {showPreview ? "Hide Preview" : "Show Markdown Preview"}
  </button>
</div>

{showPreview && (
  <div
    style={{
      marginTop: "0.75rem",
      padding: "0.75rem 1rem",
      borderRadius: "0.75rem",
      border: "1px solid rgba(148,163,184,0.4)",
      background: "rgba(15,23,42,0.9)",
      maxHeight: "320px",
      overflowY: "auto",
    }}
  >
    <ReactMarkdown>{content || "_Nothing to preview yet._"}</ReactMarkdown>
  </div>
)}


      <label>
        Tags
        <input
          type="text"
          placeholder="Comma-separated tags (e.g., react, javascript, webdev)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </label>

      <button type="submit" className="primary-btn">
        {submitLabel}
      </button>
    </form>
  );
}
