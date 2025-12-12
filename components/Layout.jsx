import React from "react";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function Layout({ children }) {
  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main container">{children}</main>
      <Footer />
    </div>
  );
}