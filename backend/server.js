require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  userId: String,
  profile: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    joinDate: { type: Date, default: Date.now }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  category: { type: String, default: 'General' },
  publisher: String,
  publishedYear: Number,
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  totalBorrowed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const issueSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  status: { type: String, enum: ['issued', 'returned', 'overdue'], default: 'issued' },
  fine: {
    amount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidDate: Date
  },
  renewalCount: { type: Number, default: 0 }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate fine for overdue books
issueSchema.methods.calculateFine = function() {
  if (!this.dueDate || this.status === 'returned') return 0;
  
  const now = new Date();
  const overdueDays = Math.max(0, Math.ceil((now - this.dueDate) / (1000 * 60 * 60 * 24)));
  return overdueDays * 2; // ₹2 per day fine
};

// Update status based on due date
issueSchema.pre('save', function(next) {
  if (this.status === 'issued' && this.dueDate < new Date()) {
    this.status = 'overdue';
    this.fine.amount = this.calculateFine();
  }
  next();
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const Issue = mongoose.model('Issue', issueSchema);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Library Management System API is running!',
    endpoints: {
      seed: '/api/seed (POST)',
      login: '/api/login (POST)',
      books: '/api/books (GET)',
      search: '/api/searchbooks (POST)',
      reports: {
        overdue: '/api/reports/overdue (GET)',
        popular: '/api/reports/popular-books (GET)',
        userActivity: '/api/reports/user-activity (GET)',
        fines: '/api/reports/fines (GET)',
        stats: '/api/reports/library-stats (GET)'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ============ AUTH ROUTES ============
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    const { role, username, password } = req.body;
    
    const user = await User.findOne({ username, role, isActive: true });
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.json({ success: false, message: 'Invalid credentials.' });
    }
    
    res.json({ 
      success: true, 
      role,
      user: { id: user._id, username: user.username, userId: user.userId }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============ BOOK ROUTES ============
app.post('/api/addbook', async (req, res) => {
  try {
    console.log('📚 Adding book:', req.body);
    const { title, author, isbn, category, totalCopies } = req.body;
    
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.json({ success: false, message: 'Book with this ISBN already exists.' });
    }
    
    const book = new Book({
      title, author, isbn,
      category: category || 'General',
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1
    });
    
    await book.save();
    console.log('✅ Book added successfully');
    res.json({ success: true, message: 'Book added successfully!', book });
  } catch (error) {
    console.error('❌ Add book error:', error);
    res.status(500).json({ success: false, message: 'Failed to add book.' });
  }
});

app.post('/api/removebook', async (req, res) => {
  try {
    const { isbn } = req.body;
    const book = await Book.findOne({ isbn });
    
    if (!book) {
      return res.json({ success: false, message: 'Book not found.' });
    }
    
    await Book.findByIdAndDelete(book._id);
    res.json({ success: true, message: 'Book removed successfully!' });
  } catch (error) {
    console.error('❌ Remove book error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove book.' });
  }
});

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
    console.error('❌ Search books error:', error);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find({ isActive: true }).sort({ title: 1 });
    res.json({ success: true, books });
  } catch (error) {
    console.error('❌ Get books error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch books.' });
  }
});

// ============ REPORTS ROUTES ============
app.get('/api/reports/overdue', async (req, res) => {
  try {
    console.log('📊 Generating overdue books report...');
    
    const overdueIssues = await Issue.find({
      status: { $in: ['overdue', 'issued'] },
      dueDate: { $lt: new Date() },
      returnDate: { $exists: false }
    }).populate('book').populate('user');
    
    const overdueBooks = overdueIssues.map(issue => {
      const daysOverdue = Math.ceil((new Date() - issue.dueDate) / (1000 * 60 * 60 * 24));
      return {
        title: issue.book.title,
        author: issue.book.author,
        isbn: issue.book.isbn,
        borrower: issue.user.username,
        borrowerRole: issue.user.role,
        issueDate: issue.issueDate,
        dueDate: issue.dueDate,
        daysOverdue: daysOverdue,
        fine: daysOverdue * 2
      };
    });
    
    res.json({ success: true, overdueBooks, count: overdueBooks.length });
  } catch (error) {
    console.error('❌ Overdue report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate overdue report.' });
  }
});

app.get('/api/reports/popular-books', async (req, res) => {
  try {
    console.log('📊 Generating popular books report...');
    
    const books = await Book.find({ isActive: true }).sort({ totalBorrowed: -1 });
    
    const popularBooks = books.map(book => ({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalBorrowed: book.totalBorrowed || 0,
      availableCopies: book.availableCopies,
      totalCopies: book.totalCopies
    }));
    
    res.json({ success: true, books: popularBooks });
  } catch (error) {
    console.error('❌ Popular books report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate popular books report.' });
  }
});

app.get('/api/reports/user-activity', async (req, res) => {
  try {
    console.log('📊 Generating user activity report...');
    
    const users = await User.find({ isActive: true });
    const userActivity = [];
    
    for (const user of users) {
      const totalIssued = await Issue.countDocuments({ user: user._id });
      const totalReturned = await Issue.countDocuments({ user: user._id, returnDate: { $exists: true } });
      const currentlyIssued = await Issue.countDocuments({ 
        user: user._id, 
        status: { $in: ['issued', 'overdue'] },
        returnDate: { $exists: false }
      });
      
      const unpaidFines = await Issue.aggregate([
        { $match: { user: user._id, 'fine.isPaid': false } },
        { $group: { _id: null, totalFine: { $sum: '$fine.amount' } } }
      ]);
      
      userActivity.push({
        username: user.username,
        role: user.role,
        userId: user.userId,
        joinDate: user.profile?.joinDate || user.createdAt,
        totalBooksIssued: totalIssued,
        totalBooksReturned: totalReturned,
        currentlyIssued: currentlyIssued,
        outstandingFines: unpaidFines.length > 0 ? unpaidFines[0].totalFine : 0
      });
    }
    
    res.json({ success: true, users: userActivity });
  } catch (error) {
    console.error('❌ User activity report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate user activity report.' });
  }
});

app.get('/api/reports/fines', async (req, res) => {
  try {
    console.log('📊 Generating fines report...');
    
    const allFines = await Issue.find({
      'fine.amount': { $gt: 0 }
    }).populate('user').populate('book');
    
    const totalOutstanding = await Issue.aggregate([
      { $match: { 'fine.isPaid': false, 'fine.amount': { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fine.amount' } } }
    ]);
    
    const totalCollected = await Issue.aggregate([
      { $match: { 'fine.isPaid': true, 'fine.amount': { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fine.amount' } } }
    ]);
    
    const fineDetails = allFines.map(issue => ({
      username: issue.user.username,
      bookTitle: issue.book.title,
      amount: issue.fine.amount,
      status: issue.fine.isPaid ? 'Paid' : 'Outstanding',
      dueDate: issue.dueDate,
      paidDate: issue.fine.paidDate
    }));
    
    res.json({ 
      success: true, 
      summary: {
        totalOutstanding: totalOutstanding.length > 0 ? totalOutstanding[0].total : 0,
        totalCollected: totalCollected.length > 0 ? totalCollected[0].total : 0
      },
      fines: fineDetails
    });
  } catch (error) {
    console.error('❌ Fines report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate fines report.' });
  }
});

app.get('/api/reports/library-stats', async (req, res) => {
  try {
    console.log('📊 Generating library statistics...');
    
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalCopies = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalCopies' } } }
    ]);
    
    const availableCopies = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$availableCopies' } } }
    ]);
    
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeIssues = await Issue.countDocuments({ 
      status: { $in: ['issued', 'overdue'] },
      returnDate: { $exists: false }
    });
    
    const categoryBreakdown = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const categories = {};
    categoryBreakdown.forEach(cat => {
      categories[cat._id || 'General'] = cat.count;
    });
    
    res.json({
      success: true,
      stats: {
        totalBooks,
        totalCopies: totalCopies.length > 0 ? totalCopies[0].total : 0,
        availableCopies: availableCopies.length > 0 ? availableCopies[0].total : 0,
        issuedCopies: activeIssues,
        totalUsers,
        activeIssues,
        categoriesBreakdown: categories
      }
    });
  } catch (error) {
    console.error('❌ Library stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate library statistics.' });
  }
});

// ============ ISSUE/RETURN ROUTES ============
app.post('/api/viewissued', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.json({ success: false, message: 'User not found.' });
    }
    
    const issues = await Issue.find({
      user: user._id,
      status: { $in: ['issued', 'overdue'] },
      returnDate: { $exists: false }
    }).populate('book');
    
    const books = issues.map(issue => ({
      title: issue.book.title,
      author: issue.book.author,
      isbn: issue.book.isbn,
      issueDate: issue.issueDate,
      dueDate: issue.dueDate,
      isOverdue: issue.dueDate && new Date() > issue.dueDate,
      fine: issue.fine.amount
    }));
    
    res.json({ success: true, books });
  } catch (error) {
    console.error('❌ View issued books error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch issued books.' });
  }
});

// ============ SEED DATA ENDPOINT ============
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Issue.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Create users
    const users = [
      { role: "admin", username: "admin1", password: "adminpass" },
      { role: "student", username: "student1", password: "studentpass" },
      { role: "teacher", username: "teacher1", password: "teacherpass" },
      { role: "student", username: "Anamika", password: "Anamika123", userId: "S123" },
      { role: "assistant", username: "assistant1", password: "assistantpass", userId: "A001" }
    ];
    
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`👥 Created ${users.length} users`);
    
    // Create sample books
    const books = [
      {
        title: "The Midnight Library",
        author: "Matt Haig", 
        isbn: "978-0735211292",
        category: "Fiction",
        totalCopies: 3,
        availableCopies: 2,
        totalBorrowed: 8
      },
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "978-0593135204", 
        category: "Science Fiction",
        totalCopies: 2,
        availableCopies: 1,
        totalBorrowed: 12
      },
      {
        title: "Klara and the Sun",
        author: "Kazuo Ishiguro",
        isbn: "978-0593318171",
        category: "Fiction", 
        totalCopies: 2,
        availableCopies: 2,
        totalBorrowed: 5
      },
      {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0553380163",
        category: "Science",
        totalCopies: 1,
        availableCopies: 0,
        totalBorrowed: 15
      },
      {
        title: "Mrinmoy's History",
        author: "Mrinmoy",
        isbn: "20015n",
        category: "History",
        totalCopies: 1,
        availableCopies: 1,
        totalBorrowed: 3
      },
      {
        title: "To Kill a Mockingbird", 
        author: "Harper Lee",
        isbn: "978-0061120084",
        category: "Classic Literature",
        totalCopies: 2,
        availableCopies: 1,
        totalBorrowed: 20
      }
    ];
    
    const createdBooks = [];
    for (const bookData of books) {
      const book = new Book(bookData);
      await book.save();
      createdBooks.push(book);
    }
    console.log(`📚 Created ${books.length} books`);
    
    // Create sample issues (some overdue for demonstration)
    const issueData = [
      {
        book: createdBooks[0]._id, // The Midnight Library
        user: createdUsers[1]._id, // student1
        issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),   // 6 days overdue
        status: 'overdue',
        fine: { amount: 12, isPaid: false }
      },
      {
        book: createdBooks[1]._id, // Project Hail Mary  
        user: createdUsers[3]._id, // Anamika
        issueDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),   // 4 days overdue
        status: 'overdue',
        fine: { amount: 8, isPaid: false }
      },
      {
        book: createdBooks[3]._id, // A Brief History of Time
        user: createdUsers[2]._id, // teacher1
        issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),   // 4 days from now
        status: 'issued'
      },
      {
        book: createdBooks[5]._id, // To Kill a Mockingbird
        user: createdUsers[1]._id, // student1
        issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        dueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),  // 11 days ago
        returnDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // returned 5 days ago
        status: 'returned',
        fine: { amount: 10, isPaid: true, paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      }
    ];
    
    for (const issue of issueData) {
      const newIssue = new Issue(issue);
      await newIssue.save();
    }
    console.log(`📋 Created ${issueData.length} sample issues`);
    
    // Update book endpoint
app.post('/api/updatebook', async (req, res) => {
  try {
    console.log('📝 Updating book:', req.body);
    const { bookId, title, author, category, totalCopies } = req.body;
    
    const book = await Book.findById(bookId);
    if (!book) {
      return res.json({ success: false, message: 'Book not found.' });
    }
    
    // Calculate new available copies
    const issuedCopies = book.totalCopies - book.availableCopies;
    const newAvailableCopies = Math.max(0, totalCopies - issuedCopies);
    
    // Update book fields
    book.title = title;
    book.author = author;
    book.category = category || 'General';
    book.totalCopies = totalCopies;
    book.availableCopies = newAvailableCopies;
    
    await book.save();
    
    console.log('✅ Book updated successfully');
    res.json({ 
      success: true, 
      message: 'Book updated successfully!', 
      book: {
        id: book._id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies
      }
    });
  } catch (error) {
    console.error('❌ Update book error:', error);
    res.status(500).json({ success: false, message: 'Failed to update book.' });
  }
});
    // Final counts
    const userCount = await User.countDocuments();
    const bookCount = await Book.countDocuments();
    const issueCount = await Issue.countDocuments();
    
    console.log('✅ Database seeded successfully!');
    console.log(`📊 Final counts: ${userCount} users, ${bookCount} books, ${issueCount} issues`);
    
    res.json({ 
      success: true, 
      message: 'Database seeded successfully with sample data!',
      data: {
        users: userCount,
        books: bookCount,
        issues: issueCount
      }
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed database.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Update book endpoint
app.post('/api/updatebook', async (req, res) => {
  try {
    console.log('📝 Updating book:', req.body);
    const { bookId, title, author, category, totalCopies } = req.body;
    
    if (!bookId || !title || !author || !totalCopies) {
      return res.json({ success: false, message: 'Missing required fields.' });
    }
    
    const book = await Book.findById(bookId);
    if (!book) {
      return res.json({ success: false, message: 'Book not found.' });
    }
    
    // Calculate available copies (don't let it go below 0)
    const currentIssued = book.totalCopies - book.availableCopies;
    const newAvailable = Math.max(0, parseInt(totalCopies) - currentIssued);
    
    // Update book
    book.title = title.trim();
    book.author = author.trim();
    book.category = category || 'General';
    book.totalCopies = parseInt(totalCopies);
    book.availableCopies = newAvailable;
    
    await book.save();
    
    console.log('✅ Book updated successfully:', book.title);
    res.json({ 
      success: true, 
      message: 'Book updated successfully!',
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies
      }
    });
  } catch (error) {
    console.error('❌ Update book error:', error);
    res.status(500).json({ success: false, message: 'Failed to update book: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
});

