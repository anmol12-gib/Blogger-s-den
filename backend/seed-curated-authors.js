// backend/seed-curated-authors.js
require("dotenv").config();
const mongoose = require("mongoose");

const curatedAuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  handle: { type: String },
  shortBio: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  website: { type: String, default: "" },
  twitter: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  sourceFeeds: [String],
  tags: [String],
  curated: { type: Boolean, default: true },
  lastFetchedAt: { type: Date, default: null }
}, { timestamps: true });

const CuratedAuthor = mongoose.model("CuratedAuthor", curatedAuthorSchema);

// Add or extend this list with the authors you want seeded
const authors = [
  {
    name: "Sarah Drasner",
    handle: "sarah_edo",
    shortBio: "Engineering leader, author, speaker.",
    avatarUrl: "",
    website: "https://sarah.dev",
    twitter: "https://twitter.com/sarah_edo",
    sourceFeeds: ["https://sarahdrasner.com/feed/"]
  },
  {
    name: "Casey Newton",
    handle: "caseynewton",
    shortBio: "Journalist covering the intersection of tech and society.",
    website: "https://platformer.news",
    twitter: "https://twitter.com/caseynewton",
    sourceFeeds: ["https://platformer.news/feed"]
  }
  // add more author objects here...
];

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("Missing MONGODB_URI in .env — add it and try again.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, { dbName: "blog_writer" });
    console.log("Connected.");

    console.log("Seeding curated authors...");
    const ops = authors.map(a =>
      CuratedAuthor.updateOne({ name: a.name }, { $set: a }, { upsert: true })
    );
    await Promise.all(ops);

    console.log("Done! Curated authors added.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

run();
