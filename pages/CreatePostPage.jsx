import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PostForm from "../components/PostForm.jsx";
import { createPost } from "../api.js";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(postData) {
    try {
      setSaving(true);
      setError("");
      const newPost = await createPost(postData);
      navigate(`/posts/${newPost._id}`);
    } catch (err) {
      setError(err.message || "Failed to create post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Write a New Post</h1>
        <p>Share your ideas, tutorials, or stories with the world.</p>
      </div>
      {error && <ErrorMessage message={error} />}
      <PostForm
        initialValue={{}}
        onSubmit={handleCreate}
        submitLabel={saving ? "Publishing..." : "Publish Post"}
      />
    </div>
  );
}
