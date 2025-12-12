# Blogger's-den
Blogger’s Den is a fully responsive blogging platform built using React, Node.js, and MongoDB.
It enables users to publish articles, explore trending tech content, switch between dark/light themes, and manage their profile in a clean, fast, and elegant interface.

#Authentication System

Secure login and signup using JWT
Password validation (uppercase, lowercase, number, special character, minimum length)
Automatic welcome email sent to newly registered users
Protected routes: only logged-in users can create, edit, or delete posts

#Post Management
Create, edit, and delete your own posts
Auto-generated excerpts for consistent UI
Optional image upload for posts
Fully responsive post layout

#Global Tech Feed
Integrates external APIs (like GNews)
Shows trending articles from technology, AI, software, gadgets, and related fields
Clean card-based layout

#Dark/Light Theme System
One-click theme toggle
Green-black-white color palette
System remembers theme using localStorage

#Profile Dashboard
View user details
See all your posts in one place
Quick access CTA to create new posts

#Fully Responsive UI
Desktop, tablet, and mobile optimized
Adaptive grid layouts
Smooth spacing and typography scaling

📁 Project Structure
backend/
  server.js
  models/
  routes/
  utils/

frontend/
  src/
    components/
    pages/
    api.js
    AuthContext.jsx
    App.jsx
    main.jsx
    styles.css

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev

