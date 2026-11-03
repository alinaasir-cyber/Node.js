/* global use, db */

// Connect this playground to the same database used by the Books API.
use('booksdb');

const books = db.getCollection('books');

// List all books.
books.find({});

// Find books in a genre (change "fiction" to the genre you want).
books.find({ genre: { $regex: 'fiction', $options: 'i' } });

// Find books published in a specific year.
books.find({ year: 2022 });

// Count books by genre.
books.aggregate([
  {
    $group: {
      _id: '$genre',
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1, _id: 1 } }
]);
