import {expect} from '@loopback/testlab';
import sinon from 'sinon';
import axios from 'axios';
import {BookApiGatewayController} from '../../controllers/book.facade.controller';
import {Request} from '@loopback/rest';

describe('BookApiGatewayController (unit)', () => {
  let controller: BookApiGatewayController;
  const mockRequest = {
    headers: {
      authorization: 'Bearer test-token',
    },
  } as unknown as Request;

  const mockBook = {
    title: 'Test Book',
    isbn: 1234567890,
    price: 10.99,
    pubDate: '2023-01-01',
    author_name: 'John Doe',
    genre: 'Fiction',
  };

  const mockBookResponse = {
    data: mockBook,
  };

  beforeEach(() => {
    controller = new BookApiGatewayController(mockRequest);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create a book and return the created book data', async () => {
    sinon.stub(axios, 'post')
      .onFirstCall().resolves({data: mockBook}) // book
      .onSecondCall().resolves({data: {}})     // author
      .onThirdCall().resolves({data: {}});     // category

    const result = await controller.createBook(mockBook);
    expect(result).to.deepEqual(mockBook);
  });



  it('should return book details by ID', async () => {
    sinon.stub(axios, 'get')
      .onFirstCall().resolves({data: mockBook}) // book
      .onSecondCall().resolves({data: {author_id: 1, author_name: 'John'}}) // author
      .onThirdCall().resolves({data: {category_id: 2, genre: 'Fiction'}});  // category

    const result = await controller.getBookById('123');
    expect(result).to.deepEqual({
      title: mockBook.title,
      isbn: mockBook.isbn,
      price: mockBook.price,
      pubDate: mockBook.pubDate,
      author: {author_id: 1, author_name: 'John'},
      category: {category_id: 2, genre: 'Fiction'},
    });
  });

  it('should delete a book and its associations', async () => {
    sinon.stub(axios, 'get').resolves({
      data: {
        author: {author_id: 1},
        category: {category_id: 2},
      },
    });

    sinon.stub(axios, 'delete')
      .onFirstCall().resolves({}) // book
      .onSecondCall().resolves({}) // author
      .onThirdCall().resolves({}); // category

    const result = await controller.deleteBook('1234567890');
    expect(result).to.equal('Book 1234567890 and its associations deleted successfully.');
  });
});