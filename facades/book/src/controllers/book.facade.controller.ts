import {
  get,
  post,
  patch,
  del,
  requestBody,
  param,
  HttpErrors,
  RestBindings,
  Request,
} from '@loopback/rest';
import axios from 'axios';

/* Book Interface */
// Ensure the correct path to the book model
import {IBook} from '../models/book';
import {IBookDetails} from '../models/book';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {PermissionKey} from '../utils/permissionsKeys';
import {inject, intercept} from '@loopback/core';

export class BookApiGatewayController {
  private authorBaseURL = 'http://localhost:3005';
  private categoryBaseURL = 'http://localhost:3007';
  private bookBaseURL = 'http://localhost:3006';
  private facadeBaseURL = 'http://localhost:3000';
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  /* Book End Points */

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKey.PostBook]})
  @post('/books')
  async createBook(@requestBody() book: IBook): Promise<IBook | string> {
    try {
      console.log('💥💥💥💥💥💥💥💥💥💥💥💥 Creating book:', book);
      const responseBook = await axios.post(`${this.bookBaseURL}/books`, book);

      const responseAuthorName = await axios.post(
        `${this.authorBaseURL}/authors`,
        {
          isbn: book.isbn,
          author_name: book.author_name,
        },
      );

      console.log('💥💥💥💥💥💥💥💥💥💥💥💥', responseAuthorName);
      const responseCategoryName = await axios.post(
        `${this.categoryBaseURL}/categories`,
        {
          isbn: book.isbn,
          genre: book.genre,
        },
      );
      console.log('💥💥💥💥💥💥💥💥💥💥💥💥', responseCategoryName);

      return responseBook.data;
    } catch (error) {
      return `Failed to create book: ${error.message}, if status code is 422 means book already exists`;
    }
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKey.ViewBook]})
  @get('/books')
  async getAllBooks(): Promise<IBook[] | string> {
    try {
      const response = await axios.get(`${this.bookBaseURL}/books`);
      const books = response.data;

      const booksWithDetails: IBook[] = await Promise.all(
        books.map(async (book: IBook) => {
          try {
            const bookAuthorName = await axios.get(
              `${this.authorBaseURL}/authors/isbn/${book.isbn}`,
            );
            const bookCategoryName = await axios.get(
              `${this.categoryBaseURL}/categories/isbn/${book.isbn}`,
            );

            return {
              title: book.title,
              isbn: book.isbn,
              price: book.price,
              pubDate: book.pubDate,
              author: {
                author_id: bookAuthorName.data.author_id,
                author_name: bookAuthorName.data.author_name,
              },
              category: {
                category_id: bookCategoryName.data.category_id,
                genre: bookCategoryName.data.genre,
              },
            };
          } catch (error) {
            console.error(`Error fetching details for book ${book.isbn}:`);
            return {
              title: book.title,
              isbn: book.isbn,
              price: book.price,
              pubDate: book.pubDate,
              author: 'Author details not available',
              category: 'Category details not available',
              error: 'Failed to fetch author or category details',
            };
          }
        }),
      );

      return booksWithDetails;
    } catch (error) {
      return `Failed to fetch books: ${error.message}`;
    }
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKey.ViewBook]})
  @get('/books/{id}')
  async getBookById(
    @param.path.string('id') id: string,
  ): Promise<IBookDetails | string> {
    try {
      const response = await axios.get(`${this.bookBaseURL}/books/${id}`);
      const book = response.data;

      if (!book) {
        // Return a clear error message if the book is not found
        return `Book with ID ${id} not found`;
      }

      const bookAuthorName = await axios.get(
        `${this.authorBaseURL}/authors/isbn/${book.isbn}`,
      );
      const bookCategoryName = await axios.get(
        `${this.categoryBaseURL}/categories/isbn/${book.isbn}`,
      );

      return {
        title: book.title,
        isbn: book.isbn,
        price: book.price,
        pubDate: book.pubDate,
        author: {
          author_id: bookAuthorName.data.author_id,
          author_name: bookAuthorName.data.author_name,
        },
        category: {
          category_id: bookCategoryName.data.category_id,
          genre: bookCategoryName.data.genre,
        },
      };
    } catch (error) {
      return `Failed to fetch book with ID ${id}: ${error.message}`;
    }
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKey.DeleteBook]})
  @del('/books/{isbn}')
  async deleteBook(@param.path.string('isbn') isbn: string): Promise<string> {
    const token = this.req.headers.authorization;
    try {
      // Step 1: Get the book
      let book;
      try {
        const response = await axios.get(
          `${this.facadeBaseURL}/books/${isbn}`,
          {
            headers: {Authorization: token},
          },
        );
        book = response.data;
      } catch (err) {
        throw new Error(`Book fetch failed: ${err.message}`);
      }

      const author_id = book?.author?.author_id;
      const category_id = book?.category?.category_id;

      // Step 2: Delete book
      try {
        await axios.delete(`${this.bookBaseURL}/books/${isbn}`, {
          headers: {Authorization: token},
        });
      } catch (err) {
        throw new Error(`Book delete failed: ${err.message}`);
      }

      // Step 3: Delete author
      if (author_id) {
        try {
          await axios.delete(`${this.authorBaseURL}/authors/${author_id}`, {
            headers: {Authorization: token},
          });
        } catch (err) {
          console.warn(`Author delete failed: ${err.message}`);
        }
      }

      // Step 4: Delete category
      if (category_id) {
        try {
          await axios.delete(
            `${this.categoryBaseURL}/categories/${category_id}`,
            {
              headers: {Authorization: token},
            },
          );
        } catch (err) {
          console.warn(`Category delete failed: ${err.message}`);
        }
      }

      return `Book ${isbn} and its associations deleted successfully.`;
    } catch (error) {
      throw new HttpErrors.InternalServerError(error.message);
    }
  }
}
