const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    default: 'General'
  },
  publisher: String,
  publishedYear: Number,
  totalCopies: {
    type: Number,
    default: 1,
    min: 1
  },
  availableCopies: {
    type: Number,
    default: 1,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure available copies don't exceed total copies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);