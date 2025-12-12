const API_BASE_URL = "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    let message;
    try {
      const data = JSON.parse(text);
      message = data.message || text;
    } catch {
      message = text || "An error occurred";
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Existing fetchPosts now expects server pagination
export async function fetchPosts(searchQuery = "", page = 1, limit = 10) {
  const params = new URLSearchParams();
  if (searchQuery.trim() !== "") params.set("q", searchQuery.trim());
  params.set("page", page);
  params.set("limit", limit);
  const res = await fetch(`${API_BASE_URL}/posts?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchPost(id) {
  const res = await fetch(`${API_BASE_URL}/posts/${id}`);
  return handleResponse(res);
}

export async function createPost(post) {
  const res = await fetch(`${API_BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(post),
  });
  return handleResponse(res);
}

export async function updatePost(id, post) {
  const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(post),
  });
  return handleResponse(res);
}

export async function deletePost(id) {
  const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
  return handleResponse(res);
}

export async function likePost(id) {
  const res = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
  });
  return handleResponse(res);
}

export async function fetchComments(postId) {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
  return handleResponse(res);
}

export async function createComment(postId, content) {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

// Auth
export async function registerUser({ username, email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

export async function loginUser({ emailOrUsername, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername, password }),
  });
  return handleResponse(res);
}

export async function fetchGlobalFeed(searchQuery = "") {
  const params = new URLSearchParams();
  if (searchQuery.trim()) params.set("q", searchQuery.trim());
  const res = await fetch(`${API_BASE_URL}/global-feed?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchMyProfile() {
  const res = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return handleResponse(res);
}

// Authors
export async function fetchAuthors({ q = "", page = 1, limit = 20 } = {}) {
  const url = new URL(API_BASE_URL + "/authors");
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("page", page);
  url.searchParams.set("limit", limit);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch authors");
  return res.json();
}

export async function fetchAuthor(id) {
  const res = await fetch(`${API_BASE_URL}/authors/${id}`);
  if (!res.ok) throw new Error("Failed to fetch author");
  return res.json();
}

export async function fetchAuthorPosts(id, { page = 1, limit = 10 } = {}) {
  const url = new URL(`${API_BASE_URL}/authors/${id}/posts`);
  url.searchParams.set("page", page);
  url.searchParams.set("limit", limit);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch author posts");
  return res.json();
}

// Optional: update your profile (requires auth headers)
export async function updateMyProfile(data = {}) {
  const res = await fetch(`${API_BASE_URL}/authors/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(()=>({message:'Update failed'}));
    throw new Error(payload.message || "Failed to update profile");
  }
  return res.json();
}
