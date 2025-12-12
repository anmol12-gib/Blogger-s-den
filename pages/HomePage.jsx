import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchGlobalFeed } from "../api.js";
import Loader from "../components/Loader.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [likedMap, setLikedMap] = useState({});
  const [shareArticle, setShareArticle] = useState(null); // for share modal


  const query = searchParams.get("q") || "";

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        setError("");
        const data = await fetchGlobalFeed(query);
        setArticles(data);
        setStatus("success");
      } catch (err) {
        setError(err.message || "Failed to load global feed");
        setStatus("error");
      }
    }
    load();
  }, [query]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Global Tech Feed</h1>
          <p>
            Latest articles from popular sources around the world, tailored for
            developers and tech enthusiasts.
          </p>
        </div>
        <Link to="/posts/new" className="primary-btn-ghost page-cta">
          + Write a Post
        </Link>
      </div>

      {status === "loading" && <Loader />}
      {status === "error" && <ErrorMessage message={error} />}

      {status === "success" && (
        <section className="global-list">
          {articles.length === 0 ? (
            <p className="empty-state">
              No global articles found right now. Try a different search term.
            </p>
          ) : (
            articles.map((a) => (
              <article key={a.id} className="global-card">
                {a.imageUrl && (
                  <div className="global-card-image-wrapper">
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      className="global-card-image"
                    />
                  </div>
                )}
                <div className="global-card-body">
                  <h2>{a.title}</h2>
                  <p className="post-meta">
                    {a.author && <>By {a.author} · </>}
                    {a.source}
                    {a.publishedAt &&
                      ` · ${new Date(a.publishedAt).toLocaleString()}`}
                  </p>
                  {a.description && (
                    <p className="post-excerpt">{a.description}</p>
                  )}
                  <a
                    href={a.url}
                    className="primary-btn primary-btn-ghost"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read full article ↗
                  </a>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}
