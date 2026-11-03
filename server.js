const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let books = [
  { id: 1, title: 'Atomic Habits', author: 'James Clear' },
  { id: 2, title: 'Deep Work', author: 'Cal Newport' }
];

app.get('/books/search', (req, res) => {
  const author = req.query.author;
  if (!author) {
    return res.status(400).json({ error: 'Please provide an author to search for' });
  }

  const matchingBooks = books.filter((book) =>
    book.author.toLowerCase().includes(author.toLowerCase())
  );
  res.json(matchingBooks);
});

// Get all books
app.get('/books', (req, res) => {
  res.json(books);
});

// Get one book by ID
app.get('/books/:id', (req, res) => {
  const bookId = Number(req.params.id);
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json(book);
});

// Add a new book
app.post('/books', (req, res) => {
  const { title, author } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  const newBook = {
    id: books.reduce((highestId, book) => Math.max(highestId, book.id), 0) + 1,
    title,
    author
  };
  books.push(newBook);
  res.status(201).json(newBook);
});

// Update a book
app.put('/books/:id', (req, res) => {
  const bookId = Number(req.params.id);
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const { title, author } = req.body;
  if (title !== undefined) {
    book.title = title;
  }
  if (author !== undefined) {
    book.author = author;
  }

  res.json(book);
});

// Delete a book
app.delete('/books/:id', (req, res) => {
  const bookId = Number(req.params.id);
  const bookIndex = books.findIndex((item) => item.id === bookId);

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const [deletedBook] = books.splice(bookIndex, 1);
  res.json({ message: 'Book deleted successfully', deletedBook });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});