import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        React Blog Platform &copy; {new Date().getFullYear()} &middot; Built
        with React &amp; Express
      </p>
    </footer>
  );
}
