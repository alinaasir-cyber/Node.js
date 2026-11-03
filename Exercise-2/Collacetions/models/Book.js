const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true
    },
    genre: {
      type: String,
      trim: true,
      default: 'Unknown'
    },
    year: {
      type: Number,
      min: [0, 'Year cannot be less than 0']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Book', bookSchema);
