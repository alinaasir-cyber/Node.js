const Book = require('../models/Book');

const getBooks = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.genre) {
      filters.genre = { $regex: req.query.genre, $options: 'i' };
    }

    if (req.query.author) {
      filters.author = { $regex: req.query.author, $options: 'i' };
    }

    if (req.query.year) {
      const parsedYear = Number(req.query.year);

      if (Number.isNaN(parsedYear)) {
        return res.status(400).json({ message: 'Year must be a valid number' });
      }

      filters.year = parsedYear;
    }

    const books = await Book.find(filters);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

const searchBooks = async (req, res, next) => {
  try {
    const { genre } = req.query;

    if (!genre) {
      return res.status(400).json({ message: 'Please provide a genre to search for' });
    }

    const books = await Book.find({ genre: { $regex: genre, $options: 'i' } });
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const { title, author, genre, year } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    const book = await Book.create({ title, author, genre, year });
    res.status(201).json(book);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const { title, author, genre, year } = req.body;

    if (!title && !author && !genre && year === undefined) {
      return res.status(400).json({ message: 'At least one field is required to update' });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, genre, year },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully', deletedBook: book });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    next(error);
  }
};

module.exports = {
  getBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
