import {Client, expect} from '@loopback/testlab';
import {AuthorServiceApplication} from '../../application';
import {setupApplication} from './test-helper';
import {AuthorRepository} from '../../repositories';
import {Author} from '../../models';

describe('AuthorController', () => {
  let app: AuthorServiceApplication;
  let client: Client;
  let authorRepo: AuthorRepository;
  let testAuthors: Author[];

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    authorRepo = await app.getRepository(AuthorRepository);
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await authorRepo.deleteAll();
    testAuthors = await createTestAuthors();
  });

  async function createTestAuthors(): Promise<Author[]> {
    return Promise.all([
      authorRepo.create({
        author_name: 'J.K. Rowling',
        isbn: 97807,
      }),
      authorRepo.create({
        author_name: 'George Orwell',
        isbn: 9785,
      }),
      authorRepo.create({
        author_name: 'Agatha Christie',
        isbn: 97808,
      }),
    ]);
  }

  describe('POST /authors', () => {
    it('creates a new author', async () => {
      const newAuthor = {
        author_name: 'Stephen King',
        isbn: 97810,
      };

      const response = await client
        .post('/authors')
        .send(newAuthor)
        .expect(200);

      expect(response.body).to.containEql(newAuthor);
      expect(response.body).to.have.property('author_id');
      expect(response.body.author_id).to.be.a.Number();

      // Verify the author was actually saved
      const found = await authorRepo.findById(response.body.author_id);
      expect(found).to.containEql(newAuthor);
    });

    it('rejects request with missing required fields', async () => {
      const invalidAuthor = {
        // missing author_name
        isbn: 1230,
      };

      await client
        .post('/authors')
        .send(invalidAuthor)
        .expect(422);
    });

  });

  describe('GET /authors', () => {
    it('returns all authors with default pagination', async () => {
      const response = await client
        .get('/authors')
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(testAuthors.length);
      testAuthors.forEach(expectedAuthor => {
        expect(response.body).to.containDeep([expectedAuthor]);
      });
    });

    it('supports filtering by author_name', async () => {
      const response = await client
        .get('/authors')
        .query({filter: {where: {author_name: 'George Orwell'}}})
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(1);
      expect(response.body[0].author_name).to.equal('George Orwell');
    });

    it('supports pagination', async () => {
      const response = await client
        .get('/authors')
        .query({filter: {limit: 2}})
        .expect(200);

      expect(response.body).to.have.length(2);
    });
  });

  describe('GET /authors/{id}', () => {
    it('returns an author by ID', async () => {
      const testAuthor = testAuthors[0];
      const response = await client
        .get(`/authors/${testAuthor.author_id}`)
        .expect(200);

      expect(response.body).to.containEql(testAuthor);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .get('/authors/999999')
        .expect(404);
    });
  });

  describe('GET /authors/isbn/{isbn}', () => {
    it('returns an author by ISBN', async () => {
      const testAuthor = testAuthors[1];
      const response = await client
        .get(`/authors/isbn/${testAuthor.isbn}`)
        .expect(200);

      expect(response.body).to.containEql(testAuthor);
    });

    it('returns 404 for non-existent ISBN', async () => {
      await client
        .get('/authors/isbn/99')
        .expect(404);
    });
  });

  describe('PATCH /authors/{id}', () => {
    it('updates an author partially', async () => {
      const testAuthor = testAuthors[0];
      const updateData = {
        author_name: 'Updated Author Name',
      };

      await client
        .patch(`/authors/${testAuthor.author_id}`)
        .send(updateData)
        .expect(204);

      const updated = await authorRepo.findById(testAuthor.author_id);
      expect(updated.author_name).to.equal(updateData.author_name);
      // Verify other fields remain unchanged
      expect(updated.isbn).to.equal(testAuthor.isbn);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .patch('/authors/99')
        .send({author_name: 'Updated'})
        .expect(404);
    });
  });

  describe('DELETE /authors/{id}', () => {
   

    it('returns 404 for non-existent ID', async () => {
      await client
        .delete('/authors/999999')
        .expect(404);
    });
  });

  describe('GET /authors/count', () => {
    it('returns total count of authors', async () => {
      const response = await client
        .get('/authors/count')
        .expect(200);

      expect(response.body).to.have.property('count', testAuthors.length);
    });

    it('returns filtered count', async () => {
      const response = await client
        .get('/authors/count')
        .query({where: {author_name: 'George Orwell'}})
        .expect(200);

      expect(response.body).to.have.property('count', 1);
    });
  });
});