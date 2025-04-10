import {get, post, patch, del, requestBody, param} from '@loopback/rest';
import axios from 'axios';

/* Book Interface */
// Ensure the correct path to the book model
import {IBook} from '../models/book';
import {IBookDetails} from '../models/book';
import { authenticate, STRATEGY } from 'loopback4-authentication';
import { authorize } from 'loopback4-authorization';
import { PermissionKey } from '../utils/permissionsKeys';

export class BookApiGatewayController {
  private  authorBaseURL = 'http://localhost:3005';
  private  categoryBaseURL = 'http://localhost:3007';
  private bookBaseURL = 'http://localhost:3006';

  constructor() {}

  /* Book End Points */

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
        },)

        console.log('💥💥💥💥💥💥💥💥💥💥💥💥',responseAuthorName)
      const responseCategoryName = await axios.post(
        `${this.categoryBaseURL}/categories`,
        {
          isbn: book.isbn,
          genre: book.genre,
        },
      );
      console.log('💥💥💥💥💥💥💥💥💥💥💥💥',responseCategoryName)


      return responseBook.data;
    } catch (error) {
      return `Failed to create book: ${error.message}, if status code is 422 means book already exists`;
    }
  }


  @authenticate(STRATEGY.BEARER)
  // @authorize({permissions: [PermissionKey.PostBook]})

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
              publishDate: book.pubDate,
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
            console.error(
              `Error fetching details for book ${book.isbn}:`,
            
            );
            return {
              title: book.title,
              isbn: book.isbn,
              price: book.price,
              pubDate: book.pubDate,
              author_id: 'Author details not available',
              category_id: 'Category details not available',
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


  @patch('/books/{id}')
  async updateBook(
    @param.path.string('id') id: string,
    @requestBody() book: IBook,
  ): Promise<IBook | string> {
    try {
      const response = await axios.patch(
        `${this.bookBaseURL}/books/${id}`,
        book,
      );

      if (response.status !== 204) {
        return `Failed to update book with ID ${id}`;
      }

      return `Book with ID ${id} updated successfully`;
    } catch (error) {
      return `Failed to update book with ID ${id}: ${error.message}`;
    }
  } 
}