require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import models
const User = require('./models/User');
const Book = require('./models/Book');
const Issue = require('./models/Issue');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ============ AUTH ROUTES ============

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { role, username, password } = req.body;
    
    const user = await User.findOne({ username, role, isActive: true });
    
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials.' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid credentials.' });
    }
    
    res.json({ 
      success: true, 
      role,
      user: {
        id: user._id,
        username: user.username,
        userId: user.userId,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============ BOOK ROUTES ============

// Add book
app.post('/api/addbook', async (req, res) => {
  try {
    const { title, author, isbn, category, publisher, publishedYear, totalCopies } = req.body;
    
    // Check if book with same ISBN already exists
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.json({ success: false, message: 'Book with this ISBN already exists.' });
    }
    
    const book = new Book({
      title,
      author,
      isbn,
      category,
      publisher,
      publishedYear,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1
    });
    
    await book.save();
    res.json({ success: true, message: 'Book added successfully!', book });
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ success: false, message: 'Failed to add book.' });
  }
});

// Remove book
app.post('/api/removebook', async (req, res) => {
  try {
    const { isbn } = req.body;
    
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.json({ success: false, message: 'Book not found.' });
    }
    
    // Check if book is currently issued
    const issuedCount = await Issue.countDocuments({ 
      book: book._id, 
      status: 'issued' 
    });
    
    if (issuedCount > 0) {
      return res.json({ 
        success: false, 
        message: 'Cannot remove book. It is currently issued to students.' 
      });
    }
    
    await Book.findByIdAndDelete(book._id);
    res.json({ success: true, message: 'Book removed successfully!' });
  } catch (error) {
    console.error('Remove book error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove book.' });
  }
});

// Search books
app.post('/api/searchbooks', async (req, res) => {
  try {
    const { query } = req.body;
    
    const books = await Book.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { author: { $regex: query, $options: 'i' } },
            { isbn: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).limit(20);
    
    res.json({ success: true, books });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find({ isActive: true }).sort({ title: 1 });
    res.json({ success: true, books });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch books.' });
  }
});

// ============ ISSUE/RETURN ROUTES ============

// Issue book
app.post('/api/issuebook', async (req, res) => {
  try {
    const { bookId, userId, dueDate } = req.body;
    
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);
    
    if (!book || !user) {
      return res.json({ success: false, message: 'Book or user not found.' });
    }
    
    if (book.availableCopies <= 0) {
      return res.json({ success: false, message: 'Book is not available.' });
    }
    
    // Check if user already has this book
    const existingIssue = await Issue.findOne({
      book: bookId,
      user: userId,
      status: 'issued'
    });
    
    if (existingIssue) {
      return res.json({ success: false, message: 'User already has this book issued.' });
    }
    
    // Create new issue record
    const issue = new Issue({
      book: bookId,
      user: userId,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    });
    
    await issue.save();
    
    // Update book availability
    book.availableCopies -= 1;
    await book.save();
    
    res.json({ success: true, message: 'Book issued successfully!', issue });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ success: false, message: 'Failed to issue book.' });
  }
});

// Return book
app.post('/api/returnbook', async (req, res) => {
  try {
    const { bookId, userId } = req.body;
    
    const issue = await Issue.findOne({
      book: bookId,
      user: userId,
      status: 'issued'
    }).populate('book');
    
    if (!issue) {
      return res.json({ success: false, message: 'No active issue found for this book.' });
    }
    
    // Update issue record
    issue.returnDate = new Date();
    issue.status = 'returned';
    
    // Calculate fine if overdue
    if (issue.isOverdue()) {
      issue.fine.amount = issue.calculateFine();
    }
    
    await issue.save();
    
    // Update book availability
    const book = await Book.findById(bookId);
    book.availableCopies += 1;
    await book.save();
    
    res.json({ 
      success: true, 
      message: 'Book returned successfully!', 
      fine: issue.fine.amount > 0 ? issue.fine.amount : 0
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ success: false, message: 'Failed to return book.' });
  }
});

// View issued books for a user
app.post('/api/viewissued', async (req, res) => {
  try {
    const { username } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: 'User not found.' });
    }
    
    const issues = await Issue.find({
      user: user._id,
      status: 'issued'
    }).populate('book');
    
    const books = issues.map(issue => ({
      title: issue.book.title,
      author: issue.book.author,
      isbn: issue.book.isbn,
      date: issue.issueDate,
      dueDate: issue.dueDate,
      isOverdue: issue.isOverdue()
    }));
    
    res.json({ success: true, books });
  } catch (error) {
    console.error('View issued books error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch issued books.' });
  }
});

// ============ FINE ROUTES ============

// Get fines for a user
app.post('/api/getfines', async (req, res) => {
  try {
    const { username } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: 'User not found.' });
    }
    
    const issues = await Issue.find({
      user: user._id,
      'fine.amount': { $gt: 0 },
      'fine.isPaid': false
    }).populate('book');
    
    const totalFine = issues.reduce((sum, issue) => sum + issue.fine.amount, 0);
    
    res.json({ 
      success: true, 
      totalFine,
      fines: issues.map(issue => ({
        bookTitle: issue.book.title,
        amount: issue.fine.amount,
        dueDate: issue.dueDate,
        returnDate: issue.returnDate
      }))
    });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fines.' });
  }
});
// Add these lines to your server.js file around line 310 (after middleware setup)

// Serve static files from current directory (where your HTML files are)
app.use(express.static('.'));

// Root route - serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// API route for login
app.post('/api/login', async (req, res) => {
  try {
    const { role, username, password } = req.body;
    
    const user = await User.findOne({ username, role });
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ success: true, user: { username, role, userId: user.userId } });
  } catch (error) {
    res.json({ success: false, message: 'Server error' });
  }
});

// API route for searching books
app.post('/api/searchbooks', async (req, res) => {
  try {
    const { query } = req.body;
    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    });
    res.json({ success: true, books });
  } catch (error) {
    res.json({ success: false, message: 'Search failed' });
  }
});

// API route for viewing issued books
app.post('/api/viewissued', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    const issues = await Issue.find({ user: user._id, status: 'issued' })
      .populate('book', 'title author isbn');
    
    const books = issues.map(issue => ({
      title: issue.book.title,
      author: issue.book.author,
      isbn: issue.book.isbn,
      date: issue.issueDate
    }));
    
    res.json({ success: true, books });
  } catch (error) {
    res.json({ success: false, message: 'Failed to get issued books' });
  }
});

// API route for adding books (admin only)
app.post('/api/addbook', async (req, res) => {
  try {
    const { title, author, isbn } = req.body;
    
    // Check if book already exists
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.json({ success: false, message: 'Book with this ISBN already exists' });
    }
    
    const book = new Book({
      title,
      author,
      isbn,
      totalCopies: 1,
      availableCopies: 1
    });
    
    await book.save();
    res.json({ success: true, message: 'Book added successfully' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to add book' });
  }
});

// API route for removing books (admin only)
app.post('/api/removebook', async (req, res) => {
  try {
    const { isbn } = req.body;
    
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.json({ success: false, message: 'Book not found' });
    }
    
    // Check if book is currently issued
    const activeIssues = await Issue.find({ book: book._id, status: 'issued' });
    if (activeIssues.length > 0) {
      return res.json({ success: false, message: 'Cannot remove book - currently issued to users' });
    }
    
    await Book.findByIdAndDelete(book._id);
    res.json({ success: true, message: 'Book removed successfully' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to remove book' });
  }
});

// Don't forget to add path at the top of your server.js file
const path = require('path');

// ============ SEED DATA ENDPOINT ============

// Seed initial data
app.post('/api/seed', async (req, res) => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Issue.deleteMany({});
    
    // Create users
    const users = [
      { role: "admin", username: "admin1", password: "adminpass" },
      { role: "student", username: "student1", password: "studentpass" },
      { role: "teacher", username: "teacher1", password: "teacherpass" },
      { role: "student", username: "Anamika", password: "Anamika123", userId: "S123" },
      { role: "assistant", username: "assistant1", password: "assistantpass", userId: "A001" }
    ];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }
    
    // Create sample books
    const books = [
      {
        title: "The Midnight Library",
        author: "Matt Haig",
        isbn: "978-0735211292",
        category: "Fiction",
        totalCopies: 3,
        availableCopies: 3
      },
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "978-0593135204",
        category: "Science Fiction",
        totalCopies: 2,
        availableCopies: 1
      },
      {
        title: "Klara and the Sun",
        author: "Kazuo Ishiguro",
        isbn: "978-0593318171",
        category: "Fiction",
        totalCopies: 2,
        availableCopies: 2
      }
    ];
    
    for (const bookData of books) {
      const book = new Book(bookData);
      await book.save();
    }
    
    res.json({ success: true, message: 'Database seeded successfully!' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed database.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});