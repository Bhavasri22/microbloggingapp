
let users = JSON.parse(localStorage.getItem("users") || "{}");
let posts = JSON.parse(localStorage.getItem("posts") || "[]");
let comments = JSON.parse(localStorage.getItem("comments") || "[]");
let current = localStorage.getItem("current") || "";

function el(id) {
  return document.getElementById(id);
}

function save() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("posts", JSON.stringify(posts));
  localStorage.setItem("comments", JSON.stringify(comments));
}

function safe(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function showRegister() {
  el("login").classList.add("hide");
  el("register").classList.remove("hide");
}

function showLogin() {
  el("register").classList.add("hide");
  el("login").classList.remove("hide");
}

function signup() {
  let name = el("rn").value.trim();
  let username = el("ru").value.trim();
  let password = el("rp").value;

  if (!name || !username || !password) {
    alert("Please fill all fields.");
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    alert("Username: use letters, numbers or underscore.");
    return;
  }

  if (users[username]) {
    alert("Username already exists.");
    return;
  }

  users[username] = {
    name: name,
    password: password,
    followers: [],
    following: []
  };

  save();

  el("rn").value = "";
  el("ru").value = "";
  el("rp").value = "";

  alert("Registration successful! Please login.");
  showLogin();
}

function signin() {
  let username = el("lu").value.trim();
  let password = el("lp").value;

  if (!users[username] || users[username].password !== password) {
    alert("Invalid username or password.");
    return;
  }

  current = username;
  localStorage.setItem("current", current);
  openApp();
}

function openApp() {
  if (!users[current]) {
    logout();
    return;
  }

  el("auth").classList.add("hide");
  el("app").classList.remove("hide");

  updateSidebar();
  home();
}

function updateSidebar() {
  if (!users[current]) return;

  let user = users[current];

  el("sideAvatar").textContent =
    user.name.charAt(0).toUpperCase();

  el("sideName").textContent = user.name;
  el("sideUsername").textContent = "@" + current;
  el("sideFollowers").textContent = user.followers.length;
  el("sideFollowing").textContent = user.following.length;
}

function logout() {
  localStorage.removeItem("current");
  current = "";

  el("app").classList.add("hide");
  el("auth").classList.remove("hide");

  el("lu").value = "";
  el("lp").value = "";

  showLogin();
}

// Home: show own posts and followed users' posts only.
function home() {
  if (!users[current]) return;

  updateSidebar();

  let feed = posts
    .filter(post =>
      post.user === current ||
      users[current].following.includes(post.user)
    )
    .sort((a, b) => b.time - a.time);

  el("page").innerHTML = `
    <h2>Home Feed</h2>

    <div class="card post-box">
      <h3>Create a Post</h3>
      <textarea id="postText" maxlength="280"
        placeholder="What's happening?"></textarea>

      <div class="post-actions">
        <span>Maximum 280 characters</span>
        <button class="post-btn" onclick="addPost()">Post</button>
      </div>
    </div>

    <h3>Recent Posts</h3>

    ${feed.length
      ? feed.map(postHTML).join("")
      : '<div class="empty">No posts available. Follow users to see their posts!</div>'
    }
  `;
}

function addPost() {
  let text = el("postText").value.trim();

  if (!text) {
    alert("Please write something.");
    return;
  }

  posts.push({
    id: Date.now(),
    user: current,
    text: text,
    time: Date.now()
  });

  save();
  home();
}

function postHTML(post) {
  let postComments = comments.filter(c => c.post === post.id);
  let name = users[post.user]?.name || post.user;

  return `
    <div class="card">
      <div class="post-user">
        <div class="mini-avatar">
          ${safe(name.charAt(0).toUpperCase())}
        </div>
        <div>
          <b>${safe(name)}</b><br>
          <small>@${safe(post.user)}</small>
        </div>
      </div>

      <p class="post-text">${safe(post.text)}</p>

      <div class="post-date">
        ${new Date(post.time).toLocaleString()}
      </div>

      <hr>

      <b>Comments (${postComments.length})</b>

      ${postComments.map(c => `
        <div class="comment">
          <b>${safe(users[c.user]?.name || c.user)}</b>:
          ${safe(c.text)}
        </div>
      `).join("")}

      <div class="comment-form">
        <input id="c${post.id}" maxlength="200"
          placeholder="Write a comment">
        <button onclick="addComment(${post.id})">Send</button>
      </div>
    </div>
  `;
}

function addComment(id) {
  let input = el("c" + id);
  let text = input.value.trim();

  if (!text) {
    alert("Please enter a comment.");
    return;
  }

  comments.push({
    post: id,
    user: current,
    text: text
  });

  save();
  home();
}

// Explore: display every registered user except yourself.
function showUsers() {
  updateSidebar();

  let names = Object.keys(users).filter(username =>
    username !== current
  );

  el("page").innerHTML = `
    <h2>Explore Users</h2>
    <p class="muted">Follow people to see their posts in your Home Feed.</p>

    <div>
      ${names.length
        ? names.map(username => userHTML(username)).join("")
        : '<div class="empty">No other users found. Register another account first.</div>'
      }
    </div>
  `;
}

// Display a visible Follow or Unfollow button.
function userHTML(username) {
  let user = users[username];

  if (!user) return "";

  let isFollowing =
    users[current].following.includes(username);

  return `
    <div class="card user-card">
      <div class="post-user">
        <div class="mini-avatar">
          ${safe(user.name.charAt(0).toUpperCase())}
        </div>

        <div>
          <b>${safe(user.name)}</b><br>
          <small>@${safe(username)}</small>
          <p>
            Followers: ${user.followers.length}<br>
            Following: ${user.following.length}
          </p>
        </div>
      </div>

      <button
        class="follow-btn"
        onclick="follow('${safe(username)}')">
        ${isFollowing ? "Unfollow" : "Follow"}
      </button>
    </div>
  `;
}

// Follow or unfollow a user.
function follow(username) {
  if (!users[username] || username === current) return;

  let following = users[current].following;
  let followers = users[username].followers;

  if (following.includes(username)) {
    users[current].following =
      following.filter(u => u !== username);

    users[username].followers =
      followers.filter(u => u !== current);
  } else {
    users[current].following.push(username);

    if (!followers.includes(current)) {
      users[username].followers.push(current);
    }
  }

  save();
  updateSidebar();
  showUsers();
}

function showProfile() {
  if (!users[current]) return;

  updateSidebar();

  let user = users[current];

  let myPosts = posts
    .filter(post => post.user === current)
    .sort((a, b) => b.time - a.time);

  el("page").innerHTML = `
    <div class="card">
      <div class="avatar">
        ${safe(user.name.charAt(0).toUpperCase())}
      </div>

      <h2>${safe(user.name)}</h2>
      <p>@${safe(current)}</p>

      <div class="stats">
        <span class="count" onclick="people('followers')">
          <b>${user.followers.length}</b><br>Followers
        </span>

        <span class="count" onclick="people('following')">
          <b>${user.following.length}</b><br>Following
        </span>
      </div>
    </div>

    <h3>My Posts (${myPosts.length})</h3>

    ${myPosts.length
      ? myPosts.map(postHTML).join("")
      : '<div class="empty">You have not posted anything yet.</div>'
    }
  `;
}

function people(type) {
  let names = users[current][type];

  el("page").innerHTML = `
    <h2>${type === "followers" ? "My Followers" : "Following"}</h2>

    ${names.length
      ? names.map(username => userHTML(username)).join("")
      : '<div class="empty">No users found.</div>'
    }

    <button class="outline" onclick="showProfile()">
      Back to Profile
    </button>
  `;
}

// Restore session after refreshing.
if (current && users[current]) {
  openApp();
} else {
  current = "";
  localStorage.removeItem("current");
}
