require('dotenv').config();
const express = require('express');
const connectDB = require('./Collacetions/config/db');
const bookRoutes = require('./Collacetions/routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Books API is running' });
});

app.use('/books', bookRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ message });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
