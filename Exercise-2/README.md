# Books API

A MongoDB-powered CRUD API for managing books.

## Setup

1. Install dependencies:
   `npm install`
2. Start the local MongoDB service on port `27017`.
3. The API connection is configured in `.env`:
   `MONGO_URI=mongodb://localhost:27017/booksdb`
4. To connect from VS Code, install the **MongoDB for VS Code** extension, open its MongoDB view, choose **Add Connection**, and enter:
   `mongodb://localhost:27017`
   Select the `booksdb` database to view the API's data.
5. Start the API:
   `npm start`

The API listens on `http://localhost:4000`.

Open `playground-1.mongodb.js` in VS Code and click **Play** to query the
same `booksdb.books` collection used by the API. The playground includes
queries for all books, genre/year filters, and a count grouped by genre.

## Endpoints

- `GET /books` — list all books
- `GET /books/:id` — get one book
- `GET /books/search?genre=fantasy` — search books by genre
- `POST /books` — create a new book
- `PUT /books/:id` — update a book
- `DELETE /books/:id` — delete a book

## Example request body

```json
{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "genre": "Fantasy",
  "year": 1937
}
```
