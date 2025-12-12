import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PostForm from "../components/PostForm.jsx";
import { fetchPost, updatePost } from "../api.js";
import Loader from "../components/Loader.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        const data = await fetchPost(id);
        setPost(data);
        setStatus("success");
      } catch (err) {
        setError(err.message || "Failed to load post.");
        setStatus("error");
      }
    }
    load();
  }, [id]);

  async function handleUpdate(postData) {
    try {
      setSaving(true);
      setError("");
      const updated = await updatePost(id, postData);
      navigate(`/posts/${updated._id}`);
    } catch (err) {
      setError(err.message || "Failed to update post.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <Loader />;

  if (status === "error")
    return (
      <div className="page">
        <ErrorMessage message={error} />
      </div>
    );

  if (!post) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Edit Post</h1>
        <p>Update your content and keep everything fresh.</p>
      </div>
      {error && <ErrorMessage message={error} />}
      <PostForm
        initialValue={post}
        onSubmit={handleUpdate}
        submitLabel={saving ? "Saving..." : "Save Changes"}
      />
    </div>
  );
}
