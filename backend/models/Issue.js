const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  fine: {
    amount: {
      type: Number,
      default: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidDate: Date
  }
}, {
  timestamps: true
});

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
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);