# Library Management System - MongoDB Setup

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (Community Edition)
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB Installation
1. Install MongoDB Community Edition
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string from "Connect" → "Connect your application"
4. Update `.env` file with your Atlas connection string

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/library_management

# Server Configuration
PORT=3001

# JWT Secret (optional for future authentication)
JWT_SECRET=your-secret-key-here
```

**For MongoDB Atlas, use:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/library_management
```

### 4. Database Seeding

Seed the database with initial data:

```bash
node scripts/seedDatabase.js
```

This will create:
- Sample users (admin, students, teachers, assistant)
- Sample books
- Sample book issues and returns
- Sample fines

### 5. Start the Server

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/seed` - Seed database (development only)

### Books
- `POST /api/addbook` - Add new book
- `POST /api/removebook` - Remove book
- `POST /api/searchbooks` - Search books
- `GET /api/books` - Get all books

### Issues & Returns
- `POST /api/issuebook` - Issue book to user
- `POST /api/returnbook` - Return book
- `POST /api/viewissued` - View user's issued books

### Fines
- `POST /api/getfines` - Get user's fines

## Default User Credentials

After seeding, you can login with:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin1 | adminpass |
| Student | student1 | studentpass |
| Student | Anamika | Anamika123 |
| Teacher | teacher1 | teacherpass |
| Assistant | assistant1 | assistantpass |

## Project Structure

```
project/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js             # User schema
│   ├── Book.js             # Book schema
│   └── Issue.js            # Book issue schema
├── scripts/
│   └── seedDatabase.js     # Database seeding
├── .env                    # Environment variables
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md             # This file
```

## Features

### User Management
- Role-based authentication (Admin, Student, Teacher, Assistant)
- Password hashing with bcrypt
- User profiles with contact information

### Book Management
- Add, remove, and search books
- Track multiple copies of same book
- Book availability tracking
- Full-text search on title, author, ISBN, and category

### Issue/Return System
- Issue books with due dates
- Track overdue books
- Automatic fine calculation
- Book renewal system (up to 2 renewals)
- Return processing with availability updates

### Fine Management
- Automatic fine calculation for overdue books
- Fine tracking and payment status
- Daily fine rates configurable

## Database Schema

### Users Collection
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (enum: admin, student, teacher, assistant),
  userId: String (unique, optional),
  profile: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String
  },
  isActive: Boolean,
  timestamps: true
}
```

### Books Collection
```javascript
{
  title: String,
  author: String,
  isbn: String (unique),
  category: String,
  publisher: String,
  publishedYear: Number,
  totalCopies: Number,
  availableCopies: Number,
  description: String,
  location: {
    shelf: String,
    section: String
  },
  isActive: Boolean,
  timestamps: true
}
```

### Issues Collection
```javascript
{
  book: ObjectId (ref: Book),
  user: ObjectId (ref: User),
  issueDate: Date,
  dueDate: Date,
  returnDate: Date,
  status: String (enum: issued, returned, overdue),
  fine: {
    amount: Number,
    isPaid: Boolean,
    paidDate: Date
  },
  renewalCount: Number (max: 2),
  timestamps: true
}
```

## MongoDB Commands

### Useful MongoDB Shell Commands

```javascript
// Connect to database
use library_management

// View collections
show collections

// Count documents
db.users.count()
db.books.count()
db.issues.count()

// Find overdue books
db.issues.find({
  status: "issued",
  dueDate: { $lt: new Date() }
})

// Find available books
db.books.find({ availableCopies: { $gt: 0 } })

// User with most issued books
db.issues.aggregate([
  { $match: { status: "issued" } },
  { $group: { _id: "$user", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 1 }
])
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - For Atlas: Ensure IP is whitelisted

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:3001 | xargs kill`

3. **Seed Script Fails**
   - Ensure MongoDB is running
   - Delete existing data: `db.dropDatabase()` in MongoDB shell
   - Run seed script again

4. **Password Hash Issues**
   - Clear browser cache
   - Re-run seed script to recreate users

## Development

### Adding New Features

1. **New Routes**: Add to `server.js`
2. **New Models**: Create in `models/` directory
3. **Database Changes**: Update seed script for testing

### Testing

You can use tools like Postman or curl to test API endpoints:

```bash
# Test login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","username":"admin1","password":"adminpass"}'

# Test search books
curl -X POST http://localhost:3001/api/searchbooks \
  -H "Content-Type: application/json" \
  -d '{"query":"midnight"}'
```

## Production Deployment

1. Use MongoDB Atlas for production database
2. Set proper environment variables
3. Enable authentication and authorization
4. Use process manager like PM2
5. Set up proper logging
6. Configure CORS for your domain

## Support

For issues or questions:
1. Check MongoDB connection
2. Verify environment variables
3. Check server logs for detailed errors
4. Ensure all dependencies are installed
