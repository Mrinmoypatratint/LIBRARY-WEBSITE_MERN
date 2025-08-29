const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'student', 'teacher', 'assistant'] }
});

// Define Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  available: { type: Boolean, default: true }
});

// Define Issued Books Schema
const issuedBookSchema = new mongoose.Schema({
  username: { type: String, required: true },
  isbn: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const IssuedBook = mongoose.model('IssuedBook', issuedBookSchema);

async function seedDatabase() {
  try {
    // Get MongoDB URI from environment variable or use default local connection
    const mongoURI = process.env.MONGODB_URI || process.env.DB_CONNECTION || 'mongodb://localhost:27017/library_db';
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoURI);
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB successfully!');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await IssuedBook.deleteMany({});
    console.log('✅ Existing data cleared!');

    // Seed Users
    console.log('👤 Seeding users...');
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'student1', password: 'student123', role: 'student' },
      { username: 'student2', password: 'student123', role: 'student' },
      { username: 'teacher1', password: 'teacher123', role: 'teacher' },
      { username: 'teacher2', password: 'teacher123', role: 'teacher' },
      { username: 'assistant1', password: 'assistant123', role: 'assistant' }
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        username: userData.username,
        password: hashedPassword,
        role: userData.role
      });
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    // Seed Books
    console.log('📚 Seeding books...');
    const books = [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5' },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4' },
      { title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4' },
      { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0-14-143951-8' },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0' },
      { title: 'Lord of the Flies', author: 'William Golding', isbn: '978-0-571-05686-2' },
      { title: 'Animal Farm', author: 'George Orwell', isbn: '978-0-452-28424-1' },
      { title: 'Brave New World', author: 'Aldous Huxley', isbn: '978-0-06-085052-4' },
      { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', isbn: '978-0-544-00341-5' },
      { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', isbn: '978-0-7475-3269-9' },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0-262-03384-8' },
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0-13-235088-4' },
      { title: 'The Pragmatic Programmer', author: 'Dave Thomas', isbn: '978-0-201-61622-4' },
      { title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0-201-63361-0' },
      { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', isbn: '978-0-596-51774-8' }
    ];

    for (const bookData of books) {
      await Book.create(bookData);
      console.log(`✅ Created book: ${bookData.title} by ${bookData.author}`);
    }

    // Seed some issued books for testing
    console.log('📖 Seeding issued books...');
    const issuedBooks = [
      { username: 'student1', isbn: '978-0-7432-7356-5', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
      { username: 'student1', isbn: '978-0-06-112008-4', title: 'To Kill a Mockingbird', author: 'Harper Lee' },
      { username: 'student2', isbn: '978-0-452-28423-4', title: '1984', author: 'George Orwell' }
    ];

    for (const issuedBookData of issuedBooks) {
      await IssuedBook.create(issuedBookData);
      // Update book availability status
      await Book.updateOne({ isbn: issuedBookData.isbn }, { available: false });
      console.log(`✅ Issued book: ${issuedBookData.title} to ${issuedBookData.username}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Users created: ${users.length}`);
    console.log(`📚 Books created: ${books.length}`);
    console.log(`📖 Issued books created: ${issuedBooks.length}`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Student: username=student1, password=student123');
    console.log('Teacher: username=teacher1, password=teacher123');
    console.log('Assistant: username=assistant1, password=assistant123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();