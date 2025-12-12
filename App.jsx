import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";

import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx";
import PostDetailPage from "./pages/PostDetailPage.jsx";
import EditPostPage from "./pages/EditPostPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";


import RequireAuth from "./RequireAuth.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        
        

        {/* AUTH PAGES – PUBLIC (no RequireAuth here!) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* PROTECTED PAGES */}
        <Route
          path="/posts/new"
          element={
            <RequireAuth>
              <CreatePostPage />
            </RequireAuth>
          }
        />

        <Route
          path="/posts/:id/edit"
          element={
            <RequireAuth>
              <EditPostPage />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
      </Routes>
    </Layout>
  );
}
