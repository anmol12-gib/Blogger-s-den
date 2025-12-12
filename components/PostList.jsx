import React from "react";
import PostCard from "./PostCard.jsx";

export default function PostList({ posts }) {
  if (!posts?.length) {
    return <p className="empty-state">No posts found. Try writing one!</p>;
  }

  return (
    <section className="post-list">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </section>
  );
}
