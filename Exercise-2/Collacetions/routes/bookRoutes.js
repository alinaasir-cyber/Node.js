const express = require('express');
const {
  getBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');

const router = express.Router();

router.get('/search', searchBooks);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
