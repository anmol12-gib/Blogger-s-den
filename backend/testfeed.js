// backend/testfeed.js
require("dotenv").config();
const axios = require("axios");
const RSSParser = require("rss-parser");
const parser = new RSSParser({ timeout: 10000 });

async function tryParseString(body) {
  try {
    const feed = await parser.parseString(body);
    return (feed.items || []).map((it) => ({
      title: it.title || "Untitled",
      link: it.link || it.guid || "",
      pubDate: it.pubDate ? new Date(it.pubDate) : new Date(),
      excerpt: it.contentSnippet || (it.summary ? it.summary : ""),
      content: it.content || it.summary || "",
      source: feed.title || "",
      guid: it.guid || it.link || it.id || "",
    }));
  } catch (err) {
    return [];
  }
}

async function fetchFeedItems(feedUrl) {
  if (!feedUrl) return [];
  const tried = new Set();

  async function attemptParseUrl(url) {
    if (tried.has(url)) return [];
    tried.add(url);
    try {
      const feed = await parser.parseURL(url);
      return (feed.items || []).map((it) => ({
        title: it.title || "Untitled",
        link: it.link || it.guid || "",
        pubDate: it.pubDate ? new Date(it.pubDate) : new Date(),
        excerpt: it.contentSnippet || (it.summary ? it.summary : ""),
        content: it.content || it.summary || "",
        source: feed.title || url,
        guid: it.guid || it.link || it.id || "",
      }));
    } catch (err) {
      console.debug("[parseURL failed]", url, err && err.message ? err.message : err);
      return [];
    }
  }

  // 1) try the exact URL
  let items = await attemptParseUrl(feedUrl);
  if (items.length) return items;

  // 2) try common variants
  const variants = [];
  if (!feedUrl.endsWith("/")) variants.push(feedUrl + "/");
  variants.push(feedUrl + "/feed");
  variants.push(feedUrl + "/feed.xml");
  variants.push(feedUrl + "/rss.xml");

  for (const v of variants) {
    items = await attemptParseUrl(v);
    if (items.length) return items;
  }

  // 3) try fetching raw HTML with axios and parse string
  try {
    const resp = await axios.get(feedUrl, { timeout: 10000 });
    if (resp && resp.data) {
      const parsed = await tryParseString(resp.data);
      if (parsed.length) return parsed;
    }
  } catch (err) {
    console.debug("[axios fetch failed]", feedUrl, err && err.message ? err.message : err);
  }

  // 4) try fetching variants via axios and parse string
  for (const v of variants) {
    try {
      const resp = await axios.get(v, { timeout: 10000 });
      if (resp && resp.data) {
        const parsed = await tryParseString(resp.data);
        if (parsed.length) return parsed;
      }
    } catch (err) {
      // ignore
    }
  }

  console.warn("fetchFeedItems error for", feedUrl, "— all attempts failed");
  return [];
}

// --- Test runner ---
(async function () {
  const testFeeds = [
    // known working feeds you can try
    "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    "https://dev.to/feed/ben",
    // the problematic one you had
    "https://sarahdrasner.com/feed/",
  ];

  for (const url of testFeeds) {
    console.log("\n=== Testing feed:", url);
    try {
      const items = await fetchFeedItems(url);
      console.log("Items fetched:", items.length);
      if (items.length) {
        console.log("  Sample item:");
        console.log("   title:", items[0].title);
        console.log("   link :", items[0].link);
        console.log("   date :", items[0].pubDate);
      } else {
        console.log("  No items parsed.");
      }
    } catch (err) {
      console.error("  Error while testing feed:", err.message || err);
    }
  }

  console.log("\nTest run complete.");
  process.exit(0);
})();
