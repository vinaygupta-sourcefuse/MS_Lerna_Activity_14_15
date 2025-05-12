import {Client, expect} from '@loopback/testlab';
import {BookServiceApplication} from '../../application';
import {setupApplication} from './test-helper';
import {BookRepository} from '../../repositories';
import {Book} from '../../models';

describe('BookController', () => {
  let app: BookServiceApplication;
  let client: Client;
  let bookRepo: BookRepository;
  let testBooks: Book[];

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    bookRepo = await app.getRepository(BookRepository);
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await bookRepo.deleteAll();
    testBooks = await createTestBooks();
  });

  async function createTestBooks(): Promise<Book[]> {
    return Promise.all([
      bookRepo.create({
        title: 'The Great Gatsby',
        isbn: 97,
        price: 13,
        author_name: 'F. Scott Fitzgerald',
        genre: 'Classic',
        pubDate: '1925-04-10'
      }),
      bookRepo.create({
        title: 'To Kill a Mockingbird',
        isbn: 9780,
        price: 10,
        author_name: 'Harper Lee',
        genre: 'Fiction',
        pubDate: '1960-07-11'
      }),
      bookRepo.create({
        title: '1984',
        isbn: 97805,
        price: 9,
        author_name: 'George Orwell',
        genre: 'Dystopian',
        pubDate: '1949-06-08'
      })
    ]);
  }

  describe('POST /books', () => {
    it('creates a new book', async () => {
      const newBook = {
        title: 'The Hobbit',
        isbn: 978054,
        price: 15,
        author_name: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        pubDate: '1937-09-21'
      };

      const response = await client
        .post('/books')
        .send(newBook)
        .expect(200);

      expect(response.body).to.containEql(newBook);
      expect(response.body).to.have.property('isbn', newBook.isbn);

      // Verify the book was actually saved
      const found = await bookRepo.findById(response.body.isbn);
      expect(found).to.containEql(newBook);
    });

    it('rejects request with missing required fields', async () => {
      const invalidBook = {
        title: 'Incomplete Book',
        isbn: 123456,
        // Missing price, author_name, genre, pubDate
      };

      await client
        .post('/books')
        .send(invalidBook)
        .expect(422);
    });

    it('rejects duplicate ISBN', async () => {
      const duplicateBook = {
        title: 'Duplicate Book',
        isbn: testBooks[0].isbn, // Using existing ISBN
        price: 97,
        author_name: 'Test Author',
        genre: 'Fiction',
        pubDate: '2023-01-01'
      };

    const response = await client
      .post('/books')
      .send(duplicateBook)
      .expect(422);

    expect(response.body).to.have.property('error');
    expect(response.body.error).to.have.property('message').match(/Duplicate entry/);
    expect(response.body.error).to.have.property('code', 'ER_DUP_ENTRY');
    });
  });

  describe('GET /books', () => {
    it('returns all books with default pagination', async () => {
      const response = await client
        .get('/books')
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(testBooks.length);
      testBooks.forEach(expectedBook => {
        expect(response.body).to.containDeep([expectedBook]);
      });
    });

    it('supports filtering by genre', async () => {
      const response = await client
        .get('/books')
        .query({filter: {where: {genre: 'Dystopian'}}})
        .expect(200);

      expect(response.body).to.have.length(1);
      expect(response.body[0].title).to.equal('1984');
    });

    it('supports pagination', async () => {
      const response = await client
        .get('/books')
        .query({filter: {limit: 2}})
        .expect(200);

      expect(response.body).to.have.length(2);
    });
  });

  describe('GET /books/{isbn}', () => {
    it('returns a book by ISBN', async () => {
      const testBook = testBooks[0];
      const response = await client
        .get(`/books/${testBook.isbn}`)
        .expect(200);

      expect(response.body).to.containEql(testBook);
    });

    it('returns 404 for non-existent ISBN', async () => {
      await client
        .get('/books/99')
        .expect(404);
    });
  });

  describe('PATCH /books/{isbn}', () => {
    it('updates a book partially', async () => {
      const testBook = testBooks[0];
      const updateData = {
        price: 15,
        title: 'The Great Gatsby - Special Edition'
      };

      await client
        .patch(`/books/${testBook.isbn}`)
        .send(updateData)
        .expect(204);

      const updated = await bookRepo.findById(testBook.isbn);
      expect(updated.price).to.equal(updateData.price);
      expect(updated.title).to.equal(updateData.title);
      // Verify other fields remain unchanged
      expect(updated.author_name).to.equal(testBook.author_name);
    });

    it('returns 404 for non-existent ISBN', async () => {
      await client
        .patch('/books/99')
        .send({price: 9.99})
        .expect(404);
    });
  });

  describe('PUT /books/{isbn}', () => {
    it('replaces entire book', async () => {
      const testBook = testBooks[0];
      const replacement = {
        title: 'Completely New Book',
        isbn: testBook.isbn, // Same ISBN
        price: 20,
        author_name: 'New Author',
        genre: 'New Genre',
        pubDate: '2023-01-01'
      };

      await client
        .put(`/books/${testBook.isbn}`)
        .send(replacement)
        .expect(204);

      const replaced = await bookRepo.findById(testBook.isbn);
      expect(replaced).to.containEql(replacement);
    });

    it('returns 400 when missing required fields', async () => {
      const testBook = testBooks[0];
      await client
        .put(`/books/${testBook.isbn}`)
        .send({
          title: 'Incomplete Book',
          isbn: testBook.isbn
          // Missing other required fields
        })
        .expect(422);
    });
  });

  describe('DELETE /books/{isbn}', () => {
    it('deletes a book', async () => {
      const testBook = testBooks[0];
      await client
        .delete(`/books/${testBook.isbn}`)
        .expect(204);

      await expect(bookRepo.findById(testBook.isbn)).to.be.rejected();
    });

    it('returns 404 for non-existent ISBN', async () => {
      await client
        .delete('/books/99')
        .expect(404);
    });
  });

  describe('GET /books/count', () => {
    it('returns total count of books', async () => {
      const response = await client
        .get('/books/count')
        .expect(200);

      expect(response.body).to.have.property('count', testBooks.length);
    });

    it('returns filtered count', async () => {
      const response = await client
        .get('/books/count')
        .query({where: {price: {lt: 10}}})
        .expect(200);

      expect(response.body.count).to.be.greaterThanOrEqual(1);
    });
  });

  describe('PATCH /books', () => {
    it('updates multiple books', async () => {
      const where = {genre: 'Fiction'};
      const updateData = {price: 12};

      const response = await client
        .patch('/books')
        .query({where})
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('count', 1);

      const updatedBooks = await bookRepo.find({where});
      updatedBooks.forEach(book => {
        expect(book.price).to.equal(updateData.price);
      });
    });
  });
});