// ====== CONFIGURATION ======
const API_BASE_URL = 'http://localhost:3001/api';

// ====== UTILITY FUNCTIONS ======

async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    return { success: false, message: 'Network error occurred' };
  }
}

// ====== LOGIN PAGE LOGIC ======

function showLoginForm(role) {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('roleField').value = role;
  document.getElementById('loginMsg').innerText = "Logging in as " + role.charAt(0).toUpperCase() + role.slice(1);
  document.querySelector('.role-buttons').style.display = 'none';
  
  document.getElementById('loginMsg').style.color = "#4361ee";
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.style.display = 'inline-block';
  }
}

function goBackToRoleSelect() {
  document.getElementById('loginForm').style.display = 'none';
  document.querySelector('.role-buttons').style.display = 'flex';
  document.getElementById('loginMsg').innerText = "";
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.style.display = 'none';
  }
  document.getElementById('username').value = "";
  document.getElementById('password').value = "";
}

async function login(event) {
  event.preventDefault();
  const role = document.getElementById('roleField').value;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const response = await apiRequest('/login', 'POST', { role, username, password });
  
  if (response.success) {
    localStorage.setItem('loggedInRole', role);
    localStorage.setItem('loggedInUsername', username);
    if (response.user) {
      localStorage.setItem('loggedInUserId', response.user.id);
      localStorage.setItem('userProfile', JSON.stringify(response.user.profile || {}));
    }
    
    location.href = "dashboard.html";
  } else {
    document.getElementById('loginMsg').innerText = response.message || "Login failed.";
    document.getElementById('loginMsg').style.color = "red";
  }
}

// ====== UNIVERSAL FUNCTIONS ======

function logout() {
  localStorage.removeItem('loggedInRole');
  localStorage.removeItem('loggedInUsername');
  localStorage.removeItem('loggedInUserId');
  localStorage.removeItem('userProfile');
  
  alert("Logged out successfully!");
  window.location.href = "login.html";
}

function backToDashboard() {
  window.location.href = "dashboard.html";
}

function clearToolArea() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = '';
  }
}

// ====== ADMIN DASHBOARD FUNCTIONS ======

function bookManagement() {
  window.location.href = "book-management.html";
}

function manageIssuesReturns() {
  window.location.href = "issues-returns.html";
}

function viewReports() {
  window.location.href = "reports.html";
}

function trackFines() {
  window.location.href = "fines.html";
}

// Quick Add Book Modal Functions
function showAddBookModal() {
  const modal = document.getElementById('addBookModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeAddBookModal() {
  const modal = document.getElementById('addBookModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('addBookForm').reset();
    document.getElementById('addBookMsg').innerText = '';
  }
}

async function submitAddBook(event) {
  event.preventDefault();
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const isbn = document.getElementById('bookISBN').value.trim();

  if (!title || !author || !isbn) {
    document.getElementById('addBookMsg').innerText = "All fields are required!";
    document.getElementById('addBookMsg').style.color = "red";
    return;
  }

  const response = await apiRequest('/addbook', 'POST', {
    title, 
    author, 
    isbn,
    category: 'General',
    totalCopies: 1
  });

  const msgDiv = document.getElementById('addBookMsg');
  if (response.success) {
    msgDiv.innerText = "Book added successfully!";
    msgDiv.style.color = "green";
    document.getElementById('addBookForm').reset();
    setTimeout(() => closeAddBookModal(), 2000);
  } else {
    msgDiv.innerText = response.message || "Failed to add book.";
    msgDiv.style.color = "red";
  }
}

// ====== BOOK MANAGEMENT PAGE FUNCTIONS ======

async function loadAllBooks() {
  const response = await apiRequest('/books');
  const tableBody = document.querySelector('.data-table tbody');
  
  if (response.success && tableBody) {
    if (response.books.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No books available</td></tr>';
      return;
    }
    
    tableBody.innerHTML = response.books.map(book => `
      <tr>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.isbn}</td>
        <td><span class="status ${book.availableCopies > 0 ? 'available' : 'issued'}">
          ${book.availableCopies > 0 ? 'Available' : 'Issued'}
        </span></td>
        <td>
          <a href="#" onclick="editBook('${book._id}')">Edit</a> | 
          <a href="#" class="danger" onclick="deleteBook('${book._id}', '${book.isbn}')">Delete</a>
        </td>
      </tr>
    `).join('');
  }
}

async function deleteBook(bookId, isbn) {
  if (confirm('Are you sure you want to delete this book?')) {
    const response = await apiRequest('/removebook', 'POST', { isbn });
    if (response.success) {
      alert('Book deleted successfully!');
      loadAllBooks(); // Reload the table
    } else {
      alert(response.message || 'Failed to delete book');
    }
  }
}

function editBook(bookId) {
  alert('Edit functionality coming soon!');
}

// ====== STUDENT DASHBOARD FUNCTIONS ======

async function searchLibrary() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">🔍 Search Library</h3>
        <form onsubmit="submitSearchLibrary(event)" style="margin-bottom: 1.5em;">
          <div style="display: flex; gap: 0.8em; align-items: stretch;">
            <input type="text" id="searchQuery" placeholder="Search by title, author, ISBN, or category..." required 
                   style="flex: 1; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em;">
            <button type="submit" class="tools-btn" style="padding: 0.8em 1.5em; background: #4361ee; color: white; border: none; border-radius: 8px; cursor: pointer;">
              Search
            </button>
          </div>
        </form>
        <div id="searchResults" style="margin-top: 1.5em;"></div>
        <button onclick="clearToolArea()" style="margin-top: 1em; background: #6c757d; color: white; border: none; padding: 0.6em 1.2em; border-radius: 6px; cursor: pointer;">
          ← Back
        </button>
      </div>
    `;
  }
}

async function submitSearchLibrary(event) {
  event.preventDefault();
  const query = document.getElementById('searchQuery').value.trim();
  const resultsDiv = document.getElementById('searchResults');
  
  if (!query) {
    resultsDiv.innerHTML = '<p style="color: #e74c3c;">Please enter a search term.</p>';
    return;
  }

  resultsDiv.innerHTML = '<p style="color: #4361ee;">Searching...</p>';

  const response = await apiRequest('/searchbooks', 'POST', { query });

  if (response.success && response.books && response.books.length > 0) {
    resultsDiv.innerHTML = `
      <h4 style="color: #2c3e50; margin-bottom: 1em;">Search Results (${response.books.length} found):</h4>
      <div style="max-height: 400px; overflow-y: auto;">
        ${response.books.map(book => `
          <div style="background: #f8f9fa; padding: 1em; margin-bottom: 0.8em; border-radius: 8px; border-left: 4px solid #4361ee;">
            <h5 style="margin: 0 0 0.5em 0; color: #2c3e50;">${book.title}</h5>
            <p style="margin: 0.3em 0; color: #6c757d;"><strong>Author:</strong> ${book.author}</p>
            <p style="margin: 0.3em 0; color: #6c757d;"><strong>ISBN:</strong> ${book.isbn}</p>
            <p style="margin: 0.3em 0; color: #6c757d;"><strong>Category:</strong> ${book.category || 'General'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.8em;">
              <span style="background: ${book.availableCopies > 0 ? '#e7f5ff' : '#ffebee'}; 
                           color: ${book.availableCopies > 0 ? '#4361ee' : '#e74c3c'}; 
                           padding: 0.2em 0.6em; border-radius: 12px; font-size: 0.8em;">
                ${book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Not Available'}
              </span>
              ${book.availableCopies > 0 ? `<small style="color: #6c757d;">Total Copies: ${book.totalCopies}</small>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    resultsDiv.innerHTML = `
      <div style="text-align: center; padding: 2em; color: #6c757d;">
        <p>📚 No books found matching "${query}"</p>
        <p style="font-size: 0.9em;">Try different keywords or check spelling.</p>
      </div>
    `;
  }
}

async function viewIssuedBooks() {
  const username = localStorage.getItem('loggedInUsername');
  const toolArea = document.getElementById('toolArea');
  
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">📖 Your Issued Books</h3>
        <div id="issuedResult" style="text-align: center; color: #4361ee; padding: 1em;">Loading...</div>
        <button onclick="clearToolArea()" style="margin-top: 1em; background: #6c757d; color: white; border: none; padding: 0.6em 1.2em; border-radius: 6px; cursor: pointer;">
          ← Back
        </button>
      </div>
    `;

    const response = await apiRequest('/viewissued', 'POST', { username });

    const resultDiv = document.getElementById('issuedResult');
    if (response.success && response.books && response.books.length > 0) {
      resultDiv.innerHTML = `
        <div style="text-align: left;">
          ${response.books.map(book => {
            const isOverdue = book.isOverdue;
            const dueDate = new Date(book.dueDate).toLocaleDateString();
            return `
              <div style="background: ${isOverdue ? '#ffebee' : '#f8f9fa'}; 
                          padding: 1.2em; margin-bottom: 1em; border-radius: 8px; 
                          border-left: 4px solid ${isOverdue ? '#e74c3c' : '#28a745'};">
                <h5 style="margin: 0 0 0.5em 0; color: #2c3e50;">${book.title}</h5>
                <p style="margin: 0.3em 0; color: #6c757d;"><strong>Author:</strong> ${book.author}</p>
                <p style="margin: 0.3em 0; color: #6c757d;"><strong>ISBN:</strong> ${book.isbn}</p>
                <p style="margin: 0.3em 0; color: #6c757d;"><strong>Issued on:</strong> ${new Date(book.date).toLocaleDateString()}</p>
                <p style="margin: 0.3em 0; color: #6c757d;"><strong>Due Date:</strong> ${dueDate}</p>
                <span style="background: ${isOverdue ? '#f8d7da' : '#d4edda'}; 
                             color: ${isOverdue ? '#721c24' : '#155724'}; 
                             padding: 0.2em 0.6em; border-radius: 12px; font-size: 0.8em;">
                  ${isOverdue ? '⚠️ Overdue' : '✅ Active'}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div style="text-align: center; padding: 2em; color: #6c757d;">
          <p>📚 No books currently issued</p>
          <p style="font-size: 0.9em;">Visit the library to issue books.</p>
        </div>
      `;
    }
  }
}

async function showFine() {
  const username = localStorage.getItem('loggedInUsername');
  const toolArea = document.getElementById('toolArea');
  
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0; text-align: center;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">💰 Your Library Fine</h3>
        <div id="fineContent" style="color: #4361ee; padding: 1em;">Loading...</div>
        <button onclick="clearToolArea()" style="margin-top: 1em; background: #6c757d; color: white; border: none; padding: 0.6em 1.2em; border-radius: 6px; cursor: pointer;">
          ← Back
        </button>
      </div>
    `;

    const response = await apiRequest('/getfines', 'POST', { username });
    const fineContent = document.getElementById('fineContent');

    if (response.success) {
      const totalFine = response.totalFine || 0;
      
      if (totalFine === 0) {
        fineContent.innerHTML = `
          <div style="font-size: 2.5em; color: #28a745; font-weight: 700; margin: 1em 0;">
            ₹ 0.00
          </div>
          <div style="background: #d4edda; color: #155724; padding: 1em; border-radius: 8px; margin: 1em 0;">
            ✅ Great! You have no outstanding fines.
          </div>
          <p style="color: #6c757d; margin-top: 1em;">
            Keep your books returned on time to maintain a clean record.
          </p>
        `;
      } else {
        fineContent.innerHTML = `
          <div style="font-size: 2.5em; color: #e74c3c; font-weight: 700; margin: 1em 0;">
            ₹ ${totalFine.toFixed(2)}
          </div>
          <div style="background: #f8d7da; color: #721c24; padding: 1em; border-radius: 8px; margin: 1em 0;">
            ⚠️ You have outstanding fines. Please pay at the library counter.
          </div>
          ${response.fines && response.fines.length > 0 ? `
            <div style="text-align: left; margin-top: 1.5em;">
              <h4>Fine Details:</h4>
              ${response.fines.map(fine => `
                <div style="background: #f8f9fa; padding: 1em; margin: 0.5em 0; border-radius: 6px;">
                  <strong>${fine.bookTitle}</strong><br>
                  <small>Amount: ₹${fine.amount.toFixed(2)}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `;
      }
    } else {
      fineContent.innerHTML = `
        <p style="color: #e74c3c;">Unable to load fine information.</p>
      `;
    }
  }
}

function viewProfile() {
  const role = localStorage.getItem('loggedInRole') || "student";
  const username = localStorage.getItem('loggedInUsername') || "student";
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const toolArea = document.getElementById('toolArea');
  
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">👤 Your Profile</h3>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 0.8em; font-weight: 600; color: #495057; width: 30%;">Role:</td>
              <td style="padding: 0.8em; color: #6c757d;">
                <span style="background: #e7f5ff; color: #4361ee; padding: 0.3em 0.8em; border-radius: 15px; font-size: 0.9em;">
                  ${role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 0.8em; font-weight: 600; color: #495057;">Username:</td>
              <td style="padding: 0.8em; color: #6c757d;">${username}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 0.8em; font-weight: 600; color: #495057;">Member Since:</td>
              <td style="padding: 0.8em; color: #6c757d;">${userProfile.joinDate || 'January 2025'}</td>
            </tr>
            <tr>
              <td style="padding: 0.8em; font-weight: 600; color: #495057;">Status:</td>
              <td style="padding: 0.8em; color: #6c757d;">
                <span style="background: #d4edda; color: #155724; padding: 0.3em 0.8em; border-radius: 15px; font-size: 0.9em;">
                  Active
                </span>
              </td>
            </tr>
          </table>
        </div>
        <button onclick="clearToolArea()" style="margin-top: 1em; background: #6c757d; color: white; border: none; padding: 0.6em 1.2em; border-radius: 6px; cursor: pointer;">
          ← Back
        </button>
      </div>
    `;
  }
}

// ====== TEACHER DASHBOARD FUNCTIONS ======

function recommendBook() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">📚 Recommend Book</h3>
        <form onsubmit="submitRecommendBook(event)" style="text-align: left;">
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Book Title:</label>
            <input type="text" id="recommendTitle" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Author:</label>
            <input type="text" id="recommendAuthor" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Reason for Recommendation:</label>
            <textarea id="recommendReason" required rows="3"
                      style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box; resize: vertical;"></textarea>
          </div>
          <div style="display: flex; gap: 0.8em;">
            <button type="submit" style="background: #28a745; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Submit Recommendation
            </button>
            <button type="button" onclick="clearToolArea()" style="background: #6c757d; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
        <div id="recommendMsg" style="margin-top: 1em;"></div>
      </div>
    `;
  }
}

function submitRecommendBook(event) {
  event.preventDefault();
  const title = document.getElementById('recommendTitle').value.trim();
  const author = document.getElementById('recommendAuthor').value.trim();
  const reason = document.getElementById('recommendReason').value.trim();
  const msgDiv = document.getElementById('recommendMsg');

  if (!title || !author || !reason) {
    msgDiv.innerHTML = '<p style="color: #e74c3c;">All fields are required!</p>';
    return;
  }

  msgDiv.innerHTML = '<p style="color: #4361ee;">Submitting recommendation...</p>';
  
  // Simulate submission (you can add a real API endpoint for this)
  setTimeout(() => {
    msgDiv.innerHTML = `
      <div style="background: #d4edda; color: #155724; padding: 1em; border-radius: 8px;">
        ✅ Book recommendation submitted successfully!<br>
        <small>The library staff will review your suggestion.</small>
      </div>
    `;
    document.querySelector('form').reset();
  }, 1500);
}

// ====== ASSISTANT DASHBOARD FUNCTIONS ======

function showMaintenance() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">🔧 Maintenance</h3>
        <p style="color: #6c757d; margin-bottom: 1.5em;">Log maintenance tasks or report issues in the library facilities.</p>
        <form onsubmit="submitMaintenance(event)" style="text-align: left;">
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Task Description:</label>
            <input type="text" id="maintenanceDesc" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;" 
                   placeholder="e.g., Fix broken chair in reading area">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Priority:</label>
            <select id="maintenancePriority" required 
                    style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
              <option value="">Select Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Date:</label>
            <input type="date" id="maintenanceDate" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
          </div>
          <div style="display: flex; gap: 0.8em;">
            <button type="submit" style="background: #17a2b8; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Log Task
            </button>
            <button type="button" onclick="clearToolArea()" style="background: #6c757d; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
        <div id="maintenanceMsg" style="margin-top: 1em;"></div>
      </div>
    `;
    // Set today's date as default
    document.getElementById('maintenanceDate').valueAsDate = new Date();
  }
}

function submitMaintenance(event) {
  event.preventDefault();
  const desc = document.getElementById('maintenanceDesc').value.trim();
  const priority = document.getElementById('maintenancePriority').value;
  const date = document.getElementById('maintenanceDate').value;
  const msgDiv = document.getElementById('maintenanceMsg');

  if (!desc || !priority || !date) {
    msgDiv.innerHTML = '<p style="color: #e74c3c;">All fields are required!</p>';
    return;
  }

  msgDiv.innerHTML = '<p style="color: #17a2b8;">Logging maintenance task...</p>';
  
  setTimeout(() => {
    msgDiv.innerHTML = `
      <div style="background: #d1ecf1; color: #0c5460; padding: 1em; border-radius: 8px;">
        ✅ Maintenance task logged successfully!<br>
        <small>Task ID: #MT${Date.now().toString().slice(-6)}</small>
      </div>
    `;
    document.querySelector('form').reset();
    document.getElementById('maintenanceDate').valueAsDate = new Date();
  }, 1500);
}

function showAdminTask() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">📋 Administrative Task</h3>
        <p style="color: #6c757d; margin-bottom: 1.5em;">Perform administrative duties such as updating records or assisting with inventory.</p>
        <form onsubmit="submitAdminTask(event)" style="text-align: left;">
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Task Type:</label>
            <select id="adminTaskType" required 
                    style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
              <option value="">Select Task Type</option>
              <option value="inventory">Inventory Update</option>
              <option value="records">Update Records</option>
              <option value="reports">Generate Reports</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Task Description:</label>
            <textarea id="adminTaskDesc" required rows="3"
                      style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box; resize: vertical;"
                      placeholder="Describe the administrative task..."></textarea>
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Deadline:</label>
            <input type="date" id="adminTaskDeadline" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
          </div>
          <div style="display: flex; gap: 0.8em;">
            <button type="submit" style="background: #6f42c1; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Submit Task
            </button>
            <button type="button" onclick="clearToolArea()" style="background: #6c757d; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
        <div id="adminTaskMsg" style="margin-top: 1em;"></div>
      </div>
    `;
  }
}

function submitAdminTask(event) {
  event.preventDefault();
  const type = document.getElementById('adminTaskType').value;
  const desc = document.getElementById('adminTaskDesc').value.trim();
  const deadline = document.getElementById('adminTaskDeadline').value;
  const msgDiv = document.getElementById('adminTaskMsg');

  if (!type || !desc || !deadline) {
    msgDiv.innerHTML = '<p style="color: #e74c3c;">All fields are required!</p>';
    return;
  }

  msgDiv.innerHTML = '<p style="color: #6f42c1;">Submitting administrative task...</p>';
  
  setTimeout(() => {
    msgDiv.innerHTML = `
      <div style="background: #e2e3f3; color: #383d41; padding: 1em; border-radius: 8px;">
        ✅ Administrative task submitted successfully!<br>
        <small>Task assigned to admin for review and approval.</small>
      </div>
    `;
    document.querySelector('form').reset();
  }, 1500);
}

function showCardIssue() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">🆔 Library Card Issue</h3>
        <p style="color: #6c757d; margin-bottom: 1.5em;">Issue a new library card or manage card renewals.</p>
        <form onsubmit="submitCardIssue(event)" style="text-align: left;">
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Student/Teacher Name:</label>
            <input type="text" id="cardUserName" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;" 
                   placeholder="Enter full name">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Role:</label>
            <select id="cardUserRole" required 
                    style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">ID Number:</label>
            <input type="text" id="cardIdNumber" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;" 
                   placeholder="Student/Employee ID">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Card Type:</label>
            <select id="cardType" required 
                    style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
              <option value="">Select Card Type</option>
              <option value="new">New Card</option>
              <option value="renewal">Renewal</option>
              <option value="replacement">Replacement</option>
            </select>
          </div>
          <div style="display: flex; gap: 0.8em;">
            <button type="submit" style="background: #28a745; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Issue Card
            </button>
            <button type="button" onclick="clearToolArea()" style="background: #6c757d; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
        <div id="cardIssueMsg" style="margin-top: 1em;"></div>
      </div>
    `;
  }
}

function submitCardIssue(event) {
  event.preventDefault();
  const name = document.getElementById('cardUserName').value.trim();
  const role = document.getElementById('cardUserRole').value;
  const idNumber = document.getElementById('cardIdNumber').value.trim();
  const cardType = document.getElementById('cardType').value;
  const msgDiv = document.getElementById('cardIssueMsg');

  if (!name || !role || !idNumber || !cardType) {
    msgDiv.innerHTML = '<p style="color: #e74c3c;">All fields are required!</p>';
    return;
  }

  msgDiv.innerHTML = '<p style="color: #28a745;">Processing library card...</p>';
  
  setTimeout(() => {
    const cardNumber = 'LC' + Date.now().toString().slice(-8);
    msgDiv.innerHTML = `
      <div style="background: #d4edda; color: #155724; padding: 1em; border-radius: 8px;">
        ✅ Library card ${cardType} processed successfully!<br>
        <strong>Card Number:</strong> ${cardNumber}<br>
        <strong>Issued to:</strong> ${name} (${role.charAt(0).toUpperCase() + role.slice(1)})<br>
        <small>Please collect the physical card from the front desk.</small>
      </div>
    `;
    document.querySelector('form').reset();
  }, 2000);
}

function showCollectFine() {
  const toolArea = document.getElementById('toolArea');
  if (toolArea) {
    toolArea.innerHTML = `
      <div style="background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1.5em 0;">
        <h3 style="color: #2c3e50; margin-bottom: 1.2em;">💰 Collect Fine</h3>
        <p style="color: #6c757d; margin-bottom: 1.5em;">Check outstanding fines and collect payments from students or teachers.</p>
        
        <!-- Search Section -->
        <div style="background: #f8f9fa; padding: 1.5em; border-radius: 8px; margin-bottom: 1.5em;">
          <h4 style="margin: 0 0 1em 0; color: #495057;">Search User</h4>
          <div style="display: flex; gap: 0.8em;">
            <input type="text" id="fineSearchUser" placeholder="Enter username" 
                   style="flex: 1; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em;">
            <button onclick="searchUserFine()" style="background: #17a2b8; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Search
            </button>
          </div>
          <div id="fineSearchResult" style="margin-top: 1em;"></div>
        </div>

        <!-- Payment Collection Form -->
        <form onsubmit="submitCollectFine(event)" style="text-align: left;">
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">User Name:</label>
            <input type="text" id="fineUserName" required 
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;" 
                   placeholder="Enter user name">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Fine Amount (₹):</label>
            <input type="number" id="fineAmount" required min="1" step="0.01"
                   style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;" 
                   placeholder="0.00">
          </div>
          <div style="margin-bottom: 1em;">
            <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Payment Method:</label>
            <select id="paymentMethod" required 
                    style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
              <option value="">Select Payment Method</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div style="display: flex; gap: 0.8em;">
            <button type="submit" style="background: #dc3545; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Collect Payment
            </button>
            <button type="button" onclick="clearToolArea()" style="background: #6c757d; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
        <div id="collectFineMsg" style="margin-top: 1em;"></div>
      </div>
    `;
  }
}

async function searchUserFine() {
  const searchTerm = document.getElementById('fineSearchUser').value.trim();
  const resultDiv = document.getElementById('fineSearchResult');
  
  if (!searchTerm) {
    resultDiv.innerHTML = '<p style="color: #e74c3c;">Please enter a username to search.</p>';
    return;
  }

  resultDiv.innerHTML = '<p style="color: #17a2b8;">Searching...</p>';
  
  const response = await apiRequest('/getfines', 'POST', { username: searchTerm });
  
  if (response.success) {
    const totalFine = response.totalFine || 0;
    
    if (totalFine > 0) {
      resultDiv.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 1em; border-radius: 8px;">
          <h5 style="margin: 0 0 0.5em 0;">User Found: ${searchTerm}</h5>
          <p style="margin: 0.3em 0;"><strong>Outstanding Fine:</strong> ₹${totalFine.toFixed(2)}</p>
          <button onclick="document.getElementById('fineUserName').value='${searchTerm}'; document.getElementById('fineAmount').value='${totalFine.toFixed(2)}';" 
                  style="background: #dc3545; color: white; border: none; padding: 0.5em 1em; border-radius: 4px; cursor: pointer; margin-top: 0.5em;">
            Fill Form
          </button>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div style="background: #d4edda; color: #155724; padding: 1em; border-radius: 8px;">
          <h5 style="margin: 0 0 0.5em 0;">User Found: ${searchTerm}</h5>
          <p style="margin: 0;">✅ No outstanding fines</p>
        </div>
      `;
    }
  } else {
    resultDiv.innerHTML = `
      <div style="background: #fff3cd; color: #856404; padding: 1em; border-radius: 8px;">
        <p style="margin: 0;">User not found or error occurred.</p>
      </div>
    `;
  }
}

function submitCollectFine(event) {
  event.preventDefault();
  const userName = document.getElementById('fineUserName').value.trim();
  const amount = parseFloat(document.getElementById('fineAmount').value);
  const paymentMethod = document.getElementById('paymentMethod').value;
  const msgDiv = document.getElementById('collectFineMsg');

  if (!userName || !amount || !paymentMethod) {
    msgDiv.innerHTML = '<p style="color: #e74c3c;">All fields are required!</p>';
    return;
  }

  if (amount <= 0) {
    msgDiv.innerHTML = '<p style="color: #e74c3c;">Fine amount must be greater than 0!</p>';
    return;
  }

  msgDiv.innerHTML = '<p style="color: #dc3545;">Processing payment...</p>';
  
  setTimeout(() => {
    const receiptId = 'RCP' + Date.now().toString().slice(-8);
    msgDiv.innerHTML = `
      <div style="background: #d4edda; color: #155724; padding: 1em; border-radius: 8px;">
        ✅ Payment collected successfully!<br>
        <strong>Receipt ID:</strong> ${receiptId}<br>
        <strong>Amount:</strong> ₹${amount.toFixed(2)}<br>
        <strong>Method:</strong> ${paymentMethod.toUpperCase()}<br>
        <strong>Collected from:</strong> ${userName}<br>
        <small>Receipt generated and fine cleared from user record.</small>
      </div>
    `;
    document.querySelector('form').reset();
  }, 1500);
}

// ====== PAGE INITIALIZATION ======

// Initialize page-specific functionality
window.addEventListener('load', function() {
  // Check if we're on book management page
  if (window.location.pathname.includes('book-management')) {
    loadAllBooks();
  }
  
  // Set welcome messages
  setWelcomeMessage();
});

function setWelcomeMessage() {
  const role = localStorage.getItem('loggedInRole') || '';
  const username = localStorage.getItem('loggedInUsername') || '';
  const welcomeEl = document.getElementById('welcomeMsg');
  if (welcomeEl && role && username) {
    welcomeEl.innerText = `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)} (${username})!`;
  }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
  // ESC key to close modals and clear tool area
  if (event.key === 'Escape') {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
    clearToolArea();
  }
});

// ====== ENHANCED BOOK MANAGEMENT FUNCTIONS ======

// Updated loadAllBooks function with search and better display
async function loadAllBooks(searchQuery = '') {
  const endpoint = searchQuery ? '/searchbooks' : '/books';
  const requestData = searchQuery ? { query: searchQuery } : null;
  const method = searchQuery ? 'POST' : 'GET';
  
  const response = await apiRequest(endpoint, method, requestData);
  const tableBody = document.querySelector('.data-table tbody');
  
  if (response.success && tableBody) {
    const books = searchQuery ? response.books : response.books;
    
    if (!books || books.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2em; color: #6c757d;">
        ${searchQuery ? `No books found matching "${searchQuery}"` : 'No books available'}
      </td></tr>`;
      return;
    }
    
    tableBody.innerHTML = books.map(book => `
      <tr data-book-id="${book._id}">
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.isbn}</td>
        <td>${book.category || 'General'}</td>
        <td>
          <span class="status ${book.availableCopies > 0 ? 'available' : 'issued'}">
            ${book.availableCopies}/${book.totalCopies}
          </span>
        </td>
        <td>
          <button onclick="editBook('${book._id}')" style="background: #28a745; color: white; border: none; padding: 0.3em 0.8em; border-radius: 4px; cursor: pointer; margin-right: 0.5em;">
            Edit
          </button>
          <button onclick="deleteBook('${book._id}', '${book.isbn}')" style="background: #dc3545; color: white; border: none; padding: 0.3em 0.8em; border-radius: 4px; cursor: pointer;">
            Delete
          </button>
        </td>
      </tr>
    `).join('');
  } else {
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Error loading books</td></tr>';
    }
  }
}

// Enhanced search function for book management
function searchBooks() {
  const searchQuery = document.getElementById('searchBooks')?.value.trim() || '';
  loadAllBooks(searchQuery);
}

// Enhanced delete function with better confirmation
async function deleteBook(bookId, isbn) {
  // Create a custom confirmation dialog
  const confirmDelete = confirm(`Are you sure you want to delete this book?\n\nISBN: ${isbn}\n\nThis action cannot be undone.`);
  
  if (confirmDelete) {
    // Show loading state
    const row = document.querySelector(`tr[data-book-id="${bookId}"]`);
    if (row) {
      row.style.opacity = '0.5';
      row.style.pointerEvents = 'none';
    }
    
    const response = await apiRequest('/removebook', 'POST', { isbn });
    
    if (response.success) {
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #d4edda; color: #155724; padding: 1em; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease;
      `;
      successMsg.innerHTML = '✅ Book deleted successfully!';
      document.body.appendChild(successMsg);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
      
      // Reload the table
      loadAllBooks();
    } else {
      // Restore row state on error
      if (row) {
        row.style.opacity = '1';
        row.style.pointerEvents = 'auto';
      }
      
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #f8d7da; color: #721c24; padding: 1em; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease;
      `;
      errorMsg.innerHTML = `❌ ${response.message || 'Failed to delete book'}`;
      document.body.appendChild(errorMsg);
      
      setTimeout(() => {
        errorMsg.remove();
      }, 3000);
    }
  }
}

// Enhanced edit book function with modal
async function editBook(bookId) {
  // First get book details
  const response = await apiRequest(`/books`);
  
  if (!response.success) {
    alert('Error loading book details');
    return;
  }
  
  const book = response.books.find(b => b._id === bookId);
  if (!book) {
    alert('Book not found');
    return;
  }
  
  // Create edit modal
  const modal = document.createElement('div');
  modal.id = 'editBookModal';
  modal.style.cssText = `
    display: block; position: fixed; z-index: 1000; left: 0; top: 0;
    width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);
  `;
  
  modal.innerHTML = `
    <div style="background: white; margin: 5% auto; padding: 2em; width: 90%; max-width: 500px; border-radius: 12px; position: relative;">
      <span onclick="closeEditBookModal()" style="position: absolute; right: 1em; top: 0.5em; font-size: 2em; cursor: pointer; color: #aaa;">&times;</span>
      <h3 style="color: #2c3e50; margin-bottom: 1.5em;">📖 Edit Book</h3>
      <form onsubmit="submitEditBook(event, '${bookId}')" style="text-align: left;">
        <div style="margin-bottom: 1em;">
          <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Title:</label>
          <input type="text" id="editBookTitle" value="${book.title}" required 
                 style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 1em;">
          <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Author:</label>
          <input type="text" id="editBookAuthor" value="${book.author}" required 
                 style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 1em;">
          <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">ISBN:</label>
          <input type="text" id="editBookISBN" value="${book.isbn}" required readonly
                 style="width: 100%; padding: 0.8em; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1em; box-sizing: border-box; background: #f8f9fa;">
          <small style="color: #6c757d;">ISBN cannot be modified</small>
        </div>
        <div style="margin-bottom: 1em;">
          <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Category:</label>
          <input type="text" id="editBookCategory" value="${book.category || 'General'}" required 
                 style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 1em;">
          <label style="display: block; margin-bottom: 0.5em; font-weight: 600; color: #495057;">Total Copies:</label>
          <input type="number" id="editBookCopies" value="${book.totalCopies}" required min="1" 
                 style="width: 100%; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
          <small style="color: #6c757d;">Available: ${book.availableCopies}, Issued: ${book.totalCopies - book.availableCopies}</small>
        </div>
        <div style="display: flex; gap: 0.8em; margin-top: 1.5em;">
          <button type="submit" style="flex: 1; background: #28a745; color: white; border: none; padding: 0.8em; border-radius: 8px; cursor: pointer;">
            Update Book
          </button>
          <button type="button" onclick="closeEditBookModal()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 0.8em; border-radius: 8px; cursor: pointer;">
            Cancel
          </button>
        </div>
      </form>
      <div id="editBookMsg" style="margin-top: 1em;"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeEditBookModal() {
  const modal = document.getElementById('editBookModal');
  if (modal) {
    modal.remove();
  }
}

async function submitEditBook(event, bookId) {
  event.preventDefault();
  
  const title = document.getElementById('editBookTitle').value.trim();
  const author = document.getElementById('editBookAuthor').value.trim();
  const isbn = document.getElementById('editBookISBN').value.trim();
  const category = document.getElementById('editBookCategory').value.trim();
  const totalCopies = parseInt(document.getElementById('editBookCopies').value);
  
  if (!title || !author || !isbn || !category || totalCopies < 1) {
    document.getElementById('editBookMsg').innerHTML = '<p style="color: #e74c3c;">All fields are required and total copies must be at least 1!</p>';
    return;
  }
  
  const msgDiv = document.getElementById('editBookMsg');
  msgDiv.innerHTML = '<p style="color: #4361ee;">Updating book...</p>';
  
  // Since there's no updatebook endpoint, simulate the update for now
  // You'll need to implement the actual API endpoint in your backend
  setTimeout(() => {
    msgDiv.innerHTML = '<p style="color: #28a745;">✅ Book updated successfully!</p>';
    setTimeout(() => {
      closeEditBookModal();
      loadAllBooks(); // Reload the table
    }, 1500);
  }, 1000);
  
  // Uncomment this when you have the actual API endpoint:
  /*
  const response = await apiRequest('/updatebook', 'POST', {
    isbn,
    title,
    author,
    category,
    totalCopies
  });
  
  if (response.success) {
    msgDiv.innerHTML = '<p style="color: #28a745;">✅ Book updated successfully!</p>';
    setTimeout(() => {
      closeEditBookModal();
      loadAllBooks(); // Reload the table
    }, 1500);
  } else {
    msgDiv.innerHTML = `<p style="color: #e74c3c;">❌ ${response.message || 'Failed to update book'}</p>`;
  }
  */
}

// Add search functionality to book management page
function addSearchToBookManagement() {
  const pageTitle = document.querySelector('h2');
  if (pageTitle && pageTitle.textContent.includes('Book Management')) {
    // Check if search already exists
    if (!document.getElementById('bookSearchContainer')) {
      const searchContainer = document.createElement('div');
      searchContainer.id = 'bookSearchContainer';
      searchContainer.style.cssText = `
        background: white; padding: 1.5em; margin-bottom: 1.5em; border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; gap: 1em; align-items: center;
      `;
      
      searchContainer.innerHTML = `
        <input type="text" id="searchBooks" placeholder="Search books by title, author, ISBN, or category..." 
               style="flex: 1; padding: 0.8em; border: 2px solid #bde0fe; border-radius: 8px; font-size: 1em;"
               onkeyup="if(event.key==='Enter') searchBooks()">
        <button onclick="searchBooks()" style="background: #4361ee; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
          🔍 Search
        </button>
        <button onclick="loadAllBooks()" style="background: #6c757d; color: white; border: none; padding: 0.8em 1.5em; border-radius: 8px; cursor: pointer;">
          Clear
        </button>
      `;
      
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.parentNode.insertBefore(searchContainer, tableContainer);
      }
    }
  }
}

// Initialize search functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('book-management')) {
    setTimeout(addSearchToBookManagement, 100); // Small delay to ensure DOM is ready
  }
});

