// ====== LOGIN PAGE LOGIC ======

function showLoginForm(role) {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('roleField').value = role;
  document.getElementById('loginMsg').innerText = "Logging in as " + role.charAt(0).toUpperCase() + role.slice(1);
  document.querySelector('.role-buttons').style.display = 'none';
  
  // Show which role is selected
  document.getElementById('loginMsg').style.color = "#4361ee";
  document.getElementById('backBtn').style.display = 'inline-block';  // Show Back button
}

function goBackToRoleSelect() {
  document.getElementById('loginForm').style.display = 'none';
  document.querySelector('.role-buttons').style.display = 'flex';
  document.getElementById('loginMsg').innerText = "";
  document.getElementById('backBtn').style.display = 'none';
  // Optionally clear username/password
  document.getElementById('username').value = "";
  document.getElementById('password').value = "";
}

function login(event) {
  event.preventDefault();
  const role = document.getElementById('roleField').value;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ role, username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('loggedInRole', role);
      localStorage.setItem('loggedInUsername', username);
      
      // Redirect to unified dashboard
      location.href = "dashboard.html";
      
    } else {
      document.getElementById('loginMsg').innerText = data.message || "Login failed.";
      document.getElementById('loginMsg').style.color = "red";
    }
  })
  .catch(() => {
    document.getElementById('loginMsg').innerText = "Server error.";
    document.getElementById('loginMsg').style.color = "red";
  });
}
// ====== DASHBOARD LOGIC ======

function logout() {
  // Clear localStorage
  localStorage.removeItem('loggedInRole');
  localStorage.removeItem('loggedInUsername');
  
  // Optional: Show confirmation
  alert("Logged out successfully!");
  
  // Redirect to login page
  window.location.href = "login.html";
}

function backToDashboard() {
  window.location.href = "dashboard.html";
}

// ====== ADMIN / LIBRARIAN TOOLS ======

function showAddBook() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Add Book</h3>
    <form id="addBookForm" onsubmit="submitAddBook(event)">
      <input type="text" id="bookTitle" placeholder="Title" required>
      <input type="text" id="bookAuthor" placeholder="Author" required>
      <input type="text" id="bookISBN" placeholder="ISBN" required>
      <button type="submit" class="tools-btn">Add</button>
    </form>
    <div id="addBookMsg"></div>
  `;
}

function submitAddBook(event) {
  event.preventDefault();
  // Get values
  const title = document.getElementById('bookTitle').value;
  const author = document.getElementById('bookAuthor').value;
  const isbn = document.getElementById('bookISBN').value;
  fetch('http://localhost:3001/api/addbook', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({title, author, isbn})
  })
  .then(res => res.json())
  .then(data => {
    if(data.success) {
      document.getElementById('addBookMsg').innerText = "Book added successfully!";
      document.getElementById('addBookForm').reset();
    } else {
      document.getElementById('addBookMsg').innerText = data.message || "Failed to add book.";
    }
  });
}

function showRemoveBook() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Remove Book</h3>
    <form id="removeBookForm" onsubmit="submitRemoveBook(event)">
      <input type="text" id="removeBookISBN" placeholder="ISBN" required>
      <button type="submit" class="tools-btn">Remove</button>
    </form>
    <div id="removeBookMsg"></div>
  `;
}

function submitRemoveBook(event) {
  event.preventDefault();
  const isbn = document.getElementById('removeBookISBN').value;
  fetch('http://localhost:3001/api/removebook', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({isbn})
  })
  .then(res => res.json())
  .then(data => {
    if(data.success) {
      document.getElementById('removeBookMsg').innerText = "Book removed successfully!";
      document.getElementById('removeBookForm').reset();
    } else {
      document.getElementById('removeBookMsg').innerText = data.message || "Failed to remove book.";
    }
  });
}

function manageUsers() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Manage Users</h3>
    <p>Feature coming soon.</p>
  `;
}

// Navigation functions
function bookManagement() {
  console.log("Navigating to Book Management...");
  window.location.href = "book-management.html";
}

function manageIssuesReturns() {
  console.log("Navigating to Manage Issues & Returns...");
  window.location.href = "issues-returns.html";
}

function viewReports() {
  console.log("Navigating to View Reports...");
  window.location.href = "reports.html";
}

function trackFines() {
  console.log("Navigating to Track Fines...");
  window.location.href = "fines.html";
}

// ====== STUDENT TOOLS ======

function searchLibrary() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Search Library</h3>
    <form onsubmit="submitSearchLibrary(event)">
      <input type="text" id="searchQuery" placeholder="Search by title, author, or ISBN" required style="width:85%;padding:0.7em;margin-bottom:0.8em;border-radius:6px;border:1.2px solid #bde0fe;">
      <button type="submit" class="tools-btn" style="margin-top:0.2em;">Search</button>
    </form>
    <div id="searchResults"></div>
  `;
}

function submitSearchLibrary(event) {
  event.preventDefault();
  const query = document.getElementById('searchQuery').value;
  fetch('http://localhost:3001/api/searchbooks', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query})
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.books.length > 0) {
      document.getElementById('searchResults').innerHTML = `
        <ul>
          ${data.books.map(b => `<li><b>${b.title}</b> by ${b.author} (ISBN: ${b.isbn})</li>`).join('')}
        </ul>
      `;
    } else {
      document.getElementById('searchResults').innerText = "No books found.";
    }
  });
}

function viewIssuedBooks() {
  const username = localStorage.getItem('loggedInUsername');
  document.getElementById('toolArea').innerHTML = `<h3>Your Issued Books</h3><div id="issuedResult">Loading...</div>`;
  fetch('http://localhost:3001/api/viewissued', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username})
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.books.length > 0) {
      document.getElementById('issuedResult').innerHTML = `
        <ul>
          ${data.books.map(b => `<li><b>${b.title}</b> by ${b.author} (ISBN: ${b.isbn})<br><small>Issued on: ${new Date(b.date).toLocaleDateString()}</small></li>`).join('')}
        </ul>
      `;
    } else {
      document.getElementById('issuedResult').innerText = "No issued books.";
    }
  });
}

function showFine() {
  // Demo: No real API, just show sample
  document.getElementById('toolArea').innerHTML = `
    <h3>Your Library Fine</h3>
    <div style="font-size:1.5em;color:#ef233c;font-weight:600;margin-top:1em;">
      ₹ 0.00
    </div>
    <p style="margin-top:0.8em;color:#4361ee;">You have no outstanding fines.</p>
  `;
}

function viewProfile() {
  const role = localStorage.getItem('loggedInRole') || "student";
  const username = localStorage.getItem('loggedInUsername') || "student";
  document.getElementById('toolArea').innerHTML = `
    <h3>Your Profile</h3>
    <table style="margin:auto;border-collapse:collapse;width:90%;background:#f4f4fb;border-radius:8px;">
      <tr><th style="text-align:left;padding:0.5em;">Role</th><td style="text-align:left;padding:0.5em;">${role.charAt(0).toUpperCase() + role.slice(1)}</td></tr>
      <tr><th style="text-align:left;padding:0.5em;">Username</th><td style="text-align:left;padding:0.5em;">${username}</td></tr>
    </table>
  `;
}

// ====== TEACHER TOOLS ======

function recommendBook() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Recommend Book</h3>
    <p>Feature coming soon.</p>
  `;
}

// ====== ASSISTANT TOOLS ======

function showMaintenance() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Maintenance</h3>
    <p>Log maintenance tasks or report issues in the library facilities.</p>
    <!-- Implementation: Add form or connection to backend here -->
  `;
}

function showAdminTask() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Administrative Task</h3>
    <p>Perform administrative duties such as updating records or assisting with inventory.</p>
    <!-- Implementation: Add form or connection to backend here -->
  `;
}

function showCardIssue() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Library Card Issue</h3>
    <p>Issue a new library card or manage card renewals.</p>
    <!-- Implementation: Add form or connection to backend here -->
  `;
}

function showCollectFine() {
  document.getElementById('toolArea').innerHTML = `
    <h3>Collect Fine</h3>
    <p>Check outstanding fines and collect payments from students or teachers.</p>
    <!-- Implementation: Add form or connection to backend here -->
  `;
}

// ====== OPTIONAL: Role-based Welcome Message ======
function setWelcomeMessage() {
  const role = localStorage.getItem('loggedInRole') || '';
  const username = localStorage.getItem('loggedInUsername') || '';
  const welcomeEl = document.getElementById('welcomeMsg');
  if (welcomeEl) {
    if (role && username) {
      welcomeEl.innerText = `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)} (${username})!`;
    }
  }
}

// Call on dashboard page load if desired
// window.onload = setWelcomeMessage;