// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const axios = require("axios");
const RSSParser = require("rss-parser");
const cron = require("node-cron");

const parser = new RSSParser({ timeout: 10000 });
const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: "6mb" }));

// ---- MongoDB connection ----
mongoose
  .connect(MONGO_URI, { dbName: "blog_writer" })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ---- Mail transporter (optional) ----
const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

async function sendWelcomeEmail(toEmail, username) {
  if (!mailTransporter.options.auth.user) return; // SMTP not configured
  const from = process.env.SMTP_FROM || "no-reply@example.com";
  const mailOptions = {
    from,
    to: toEmail,
    subject: "Welcome to Blogger's Den",
    text: `Hi ${username},

Thanks for signing up at Blogger's Den! You can now log in and start writing your posts.

Happy writing!
— Blogger's Den Team`,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to", toEmail);
  } catch (err) {
    console.error("Failed to send welcome email:", err.message || err);
  }
}

// ---- Schemas & Models ----
const { Schema, model, Types } = mongoose;

/* User schema */
const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },

    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    website: { type: String, default: "" },
    location: { type: String, default: "" },

    // flags
    curated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* Post schema (user-created posts) */
const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    authorName: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    imageUrl: { type: String },
    likesCount: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

/* Comment schema */
const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    authorName: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

/* CuratedAuthor schema - for famous writers you curate */
const curatedAuthorSchema = new Schema(
  {
    name: { type: String, required: true },
    handle: { type: String },
    shortBio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    website: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    sourceFeeds: [String], // RSS or API feed urls
    tags: [String],
    curated: { type: Boolean, default: true },
    lastFetchedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* CuratedPost cache schema - stores fetched items from RSS for quick response */
const curatedPostSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "CuratedAuthor", required: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    guid: { type: String },
    excerpt: { type: String },
    content: { type: String },
    publishedAt: { type: Date },
    source: { type: String },
  },
  { timestamps: true }
);

const User = model("User", userSchema);
const Post = model("Post", postSchema);
const Comment = model("Comment", commentSchema);
const CuratedAuthor = model("CuratedAuthor", curatedAuthorSchema);
const CuratedPost = model("CuratedPost", curatedPostSchema);

// ---- Helper for JWT auth ----
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, username }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ---- Utility: build excerpt ----
function buildExcerpt(content) {
  if (!content) return "";
  const cleaned = String(content).replace(/\s+/g, " ").trim();
  return cleaned.length > 160 ? cleaned.slice(0, 160).trim() + "..." : cleaned;
}

// ---- Health check ----
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---- Auth routes ----

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "username, email, password required" });

    // password policy
    const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRule.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 chars and include uppercase, lowercase, number and special char.",
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "User with that email or username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // async email send (don't block response)
    sendWelcomeEmail(user.email, user.username).catch(() => {});

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ message: "emailOrUsername and password required" });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ---- Posts routes with pagination & search ----

// GET /api/posts?q=&page=&limit=
app.get("/api/posts", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const filter = {};
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const [total, items] = await Promise.all([
      Post.countDocuments(filter),
      Post.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// GET single post
app.get("/api/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid post id" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Create post (auth)
app.post("/api/posts", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, imageUrl } = req.body;

    if (!title || !content) return res.status(400).json({ message: "Title and content are required." });

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const tagsArray = Array.isArray(tags) && tags.length ? tags.map((t) => String(t).trim()) : [];

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      excerpt: buildExcerpt(content),
      authorName: user.username,
      authorId: user._id,
      tags: tagsArray,
      imageUrl: imageUrl || "",
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// Update post (auth, author only)
app.put("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid post id" });

    const existing = await Post.findById(id);
    if (!existing) return res.status(404).json({ message: "Post not found" });

    if (existing.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed to edit this post" });
    }

    const { title, content, tags, imageUrl } = req.body;

    if (title) existing.title = title.trim();
    if (content) {
      existing.content = content.trim();
      existing.excerpt = buildExcerpt(content);
    }
    if (Array.isArray(tags)) existing.tags = tags.map((t) => String(t).trim());
    if (imageUrl !== undefined) existing.imageUrl = imageUrl;

    await existing.save();
    res.json(existing);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ message: "Failed to update post" });
  }
});

// Delete post (auth, author only)
app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid post id" });

    const existing = await Post.findById(id);
    if (!existing) return res.status(404).json({ message: "Post not found" });

    if (existing.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed to delete this post" });
    }

    await Comment.deleteMany({ postId: existing._id });
    await existing.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

// Like / Unlike post (auth)
app.post("/api/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid post id" });

    const userId = req.user.userId;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likedBy.some((uid) => uid.toString() === userId);

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter((uid) => uid.toString() !== userId);
    } else {
      post.likedBy.push(userId);
    }
    post.likesCount = post.likedBy.length;
    await post.save();

    res.json({ likesCount: post.likesCount, liked: !alreadyLiked });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Failed to like post" });
  }
});

// Comments: list + add
app.get("/api/posts/:id/comments", async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid post id" });

    const comments = await Comment.find({ postId: id }).sort({ createdAt: 1 }).lean();

    res.json(comments);
  } catch (err) {
    console.error("Fetch comments error:", err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

app.post("/api/posts/:id/comments", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid post id" });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Comment content required" });

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const comment = await Comment.create({
      postId: id,
      authorId: user._id,
      authorName: user.username,
      content: content.trim(),
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// ---- Global external blog feed (GNews) ----
app.get("/api/global-feed", async (req, res) => {
  try {
    const q = req.query.q || "technology OR programming OR software";
    const max = 12;

    if (!GNEWS_API_KEY) {
      // If user has not provided GNEWS_API_KEY, return empty array gracefully
      return res.json([]);
    }

    const resp = await axios.get("https://gnews.io/api/v4/top-headlines", {
      params: {
        token: GNEWS_API_KEY,
        lang: "en",
        max,
        q,
      },
    });

    const items = (resp.data.articles || []).map((a, index) => ({
      id: `${Date.now()}_${index}`,
      title: a.title,
      author: a.author || a.source?.name || "Unknown author",
      source: a.source?.name || "Unknown source",
      url: a.url,
      imageUrl: a.image,
      publishedAt: a.publishedAt,
      description: a.description,
      content: a.content,
    }));

    res.json(items);
  } catch (err) {
    console.error("Global feed error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch global feed" });
  }
});

// ---- Current user profile + posts ----
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ authorId: userId }).sort({ createdAt: -1 }).lean();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      posts,
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

// ---- Curated authors & curated posts (RSS fetched & cached) ----

/**
 * Fetch items from an RSS/Atom feed URL using rss-parser
 * Returns normalized items: { title, link, pubDate, excerpt, content, source, guid }
 */
// replace your existing fetchFeedItems with this version


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

  // helper to attempt a parseURL safely
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
      // log but don't throw
      console.debug("parseURL failed for", url, err && err.message ? err.message : err);
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
    console.debug("axios fetch failed for", feedUrl, err && err.message ? err.message : err);
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

  // nothing worked
  console.warn("fetchFeedItems error for", feedUrl, "— all attempts failed");
  return [];
}

/**
 * Refresh feed items for a single curated author:
 * - fetch each source feed
 * - dedupe by link/guid
 * - upsert into CuratedPost collection
 */
async function refreshAuthorFeeds(author) {
  try {
    if (!author || !author.sourceFeeds || !author.sourceFeeds.length) return;

    const all = [];
    for (const feedUrl of author.sourceFeeds) {
      const items = await fetchFeedItems(feedUrl);
      // attach author ref and source metadata
      items.forEach((it) => {
        all.push({
          authorId: author._id,
          title: it.title,
          link: it.link,
          guid: it.guid || it.link,
          excerpt: it.excerpt,
          content: it.content,
          publishedAt: it.pubDate || new Date(),
          source: it.source || feedUrl,
        });
      });
    }

    // dedupe by link/guid
    const uniqMap = new Map();
    all.forEach((it) => {
      const k = (it.guid || it.link || it.title).toString();
      if (!uniqMap.has(k)) uniqMap.set(k, it);
    });
    const unique = Array.from(uniqMap.values());

    // keep latest N items (say 50)
    unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const toKeep = unique.slice(0, 50);

    // upsert each curated post (by link or guid)
    const ops = toKeep.map((p) =>
      CuratedPost.updateOne(
        { authorId: p.authorId, link: p.link },
        { $set: p },
        { upsert: true }
      )
    );
    await Promise.all(ops);

    // Remove old items beyond 200 for this author to prevent unbounded growth
    const keepLinks = toKeep.map((t) => t.link);
    await CuratedPost.deleteMany({ authorId: author._id, link: { $nin: keepLinks } });

    // update timestamp
    author.lastFetchedAt = new Date();
    await author.save();
  } catch (err) {
    console.error("refreshAuthorFeeds error", err.message || err);
  }
}

/* Route: list curated authors (public) */
app.get("/api/curated-authors", async (req, res) => {
  try {
    const items = await CuratedAuthor.find({}).sort({ name: 1 }).lean();
    res.json({ items });
  } catch (err) {
    console.error("GET /api/curated-authors error", err);
    res.status(500).json({ message: "Failed to fetch curated authors" });
  }
});

/* Route: get curated author posts (read from cache) */
app.get("/api/curated-authors/:id/posts", async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid author id" });

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 200);

    const filter = { authorId: id };
    const [total, items] = await Promise.all([
      CuratedPost.countDocuments(filter),
      CuratedPost.find(filter).sort({ publishedAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("GET /api/curated-authors/:id/posts error", err);
    res.status(500).json({ message: "Failed to fetch curated posts" });
  }
});

/* Route: get curated author detail */
app.get("/api/curated-authors/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const author = await CuratedAuthor.findById(id).lean();
    if (!author) return res.status(404).json({ message: "Curated author not found" });

    res.json(author);
  } catch (err) {
    console.error("GET /api/curated-authors/:id error", err);
    res.status(500).json({ message: "Failed to fetch author" });
  }
});

// ---- Public user-author endpoints (existing users as authors) ----
/* list user authors (site users) - optional */
app.get("/api/authors", async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    const filter = {};
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ username: regex }, { email: regex }];
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "authorId",
          as: "posts",
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          bio: 1,
          avatarUrl: 1,
          website: 1,
          location: 1,
          postsCount: { $size: "$posts" },
          createdAt: 1,
        },
      },
      { $sort: { postsCount: -1, createdAt: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ];

    const items = await User.aggregate(pipeline);
    const total = await User.countDocuments(filter);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("Fetch authors error:", err);
    res.status(500).json({ message: "Failed to fetch authors" });
  }
});

// GET /api/authors/:id (site user author detail)
app.get("/api/authors/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid author id" });

    const author = await User.findById(id).lean();
    if (!author) return res.status(404).json({ message: "Author not found" });

    const postsCount = await Post.countDocuments({ authorId: author._id });

    res.json({
      id: author._id,
      username: author.username,
      email: author.email,
      bio: author.bio || "",
      avatarUrl: author.avatarUrl || "",
      website: author.website || "",
      location: author.location || "",
      createdAt: author.createdAt,
      postsCount,
    });
  } catch (err) {
    console.error("Get author error:", err);
    res.status(500).json({ message: "Failed to fetch author" });
  }
});

// GET /api/authors/:id/posts (site user posts)
app.get("/api/authors/:id/posts", async (req, res) => {
  try {
    const id = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid author id" });

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const [total, items] = await Promise.all([
      Post.countDocuments({ authorId: id }),
      Post.find({ authorId: id }).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("Fetch author posts error:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// PUT /api/authors/me (update profile)
app.put("/api/authors/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bio, avatarUrl, website, location } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (bio !== undefined) user.bio = String(bio).slice(0, 2000);
    if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim();
    if (website !== undefined) user.website = String(website).trim();
    if (location !== undefined) user.location = String(location).trim();

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      website: user.website || "",
      location: user.location || "",
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ---- Scheduler: refresh curated author feeds periodically ----
async function refreshAllCuratedAuthors() {
  try {
    const authors = await CuratedAuthor.find({});
    for (const a of authors) {
      // refresh but do not block entire loop if one fails
      refreshAuthorFeeds(a).catch((err) => console.error("Error refreshing", a.name, err.message || err));
    }
  } catch (err) {
    console.error("refreshAllCuratedAuthors error", err.message || err);
  }
}

// run once on startup (non-blocking)
refreshAllCuratedAuthors().catch(() => {});

// schedule every 15 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("[cron] refreshing curated feeds", new Date().toISOString());
  refreshAllCuratedAuthors().catch((err) => console.error("cron refresh error", err));
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`✅ Backend API running on http://localhost:${PORT}`);
});
