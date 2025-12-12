import React from "react";

export default function AboutPage() {
  return (
    <div className="page">
      <h1>About This Blog Platform</h1>
      <p>
        This is a full-stack demo blog platform built with React on the front
        end and Express on the back end.
      </p>
      <p>
        It showcases how a React SPA can talk to a RESTful API to create, read,
        update, and delete blog posts. You can use this as a starting point for
        a real-world blogging system:
      </p>
      <ul className="about-list">
        <li>Extend it with user authentication and roles.</li>
        <li>Connect a real database (e.g., MongoDB, PostgreSQL).</li>
        <li>Add image uploads, comments, likes, and more.</li>
        <li>Deploy the backend and frontend to cloud hosting platforms.</li>
      </ul>
      <p>
        Feel free to modify the design, add features, and make it your own
        production-ready app.
      </p>
    </div>
  );
}
