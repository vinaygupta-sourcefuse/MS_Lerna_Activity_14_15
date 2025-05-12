import {Client, expect} from '@loopback/testlab';
import {CategoryServiceApplication} from '../../application';
import {setupApplication} from './test-helper';
import {CategoryRepository} from '../../repositories';
import {Category} from '../../models';

describe('CategoryController (acceptance)', () => {
  let app: CategoryServiceApplication;
  let client: Client;
  let categoryRepo: CategoryRepository;
  let testCategories: Category[];

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    categoryRepo = await app.getRepository(CategoryRepository);
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    // Clear database and create test fixtures
    await categoryRepo.deleteAll();
    testCategories = await createTestCategories();
  });

  // Test helper to create consistent test data
  async function createTestCategories(): Promise<Category[]> {
    return Promise.all([
      categoryRepo.create({
        genre: 'Fiction',
        isbn: 123450,
      }),
      categoryRepo.create({
        genre: 'Non-Fiction',
        isbn: 987610,
      }),
      categoryRepo.create({
        genre: 'Science Fiction',
        isbn: 11255,
      }),
    ]);
  }

  describe('POST /categories', () => {
    it('creates a new category with valid data', async () => {
      const newCategory = {
        genre: 'Biography',
        isbn: 555,
      };

      const response = await client
        .post('/categories')
        .send(newCategory)
        .expect(200);

      expect(response.body).to.containEql(newCategory);
      expect(response.body).to.have.property('category_id');
      expect(response.body.category_id).to.be.a.Number();

      // Verify the category was actually saved
      const found = await categoryRepo.findById(response.body.category_id);
      expect(found).to.containEql(newCategory);
    });

    it('rejects request with missing required fields', async () => {
      const invalidCategory = {
        // missing genre field
        isbn: 123,
      };

      const response = await client
        .post('/categories')
        .send(invalidCategory)
        .expect(422);

      expect(response.body.error).to.containEql({
        code: 'VALIDATION_FAILED',
        statusCode: 422,
      });
    });

  });

  describe('GET /categories', () => {
    it('returns all categories with default pagination', async () => {
      const response = await client
        .get('/categories')
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(testCategories.length);
      testCategories.forEach(expectedCategory => {
        expect(response.body).to.containDeep([expectedCategory]);
      });
    });

    it('supports filtering by genre', async () => {
      const response = await client
        .get('/categories')
        .query({filter: {where: {genre: 'Non-Fiction'}}})
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(1);
      expect(response.body[0].genre).to.equal('Non-Fiction');
    });

    it('supports pagination', async () => {
      const response = await client
        .get('/categories')
        .query({filter: {limit: 2}})
        .expect(200);

      expect(response.body).to.have.length(2);
    });
  });

  describe('GET /categories/{id}', () => {
    it('returns a category by ID', async () => {
      const testCategory = testCategories[0];
      const response = await client
        .get(`/categories/${testCategory.category_id}`)
        .expect(200);

      expect(response.body).to.containEql(testCategory);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .get('/categories/999999')
        .expect(404);
    });

    it('returns 400 for invalid ID format', async () => {
      await client
        .get('/categories/invalid-id')
        .expect(400);
    });
  });

  describe('GET /categories/isbn/{isbn}', () => {
    it('returns a category by ISBN', async () => {
      const testCategory = testCategories[1];
      const response = await client
        .get(`/categories/isbn/${testCategory.isbn}`)
        .expect(200);

      expect(response.body).to.containEql(testCategory);
    });

    it('returns 404 for non-existent ISBN', async () => {
      await client
        .get('/categories/isbn/9999999999')
        .expect(404);
    });

    it('returns 400 for invalid ISBN format', async () => {
      await client
        .get('/categories/isbn/not-a-number')
        .expect(400);
    });
  });

  describe('PATCH /categories/{id}', () => {
    it('partially updates a category by ID', async () => {
      const testCategory = testCategories[0];
      const updates = {
        genre: 'Updated Fiction',
      };

      await client
        .patch(`/categories/${testCategory.category_id}`)
        .send(updates)
        .expect(204);

      const updated = await categoryRepo.findById(testCategory.category_id);
      expect(updated.genre).to.equal(updates.genre);
      // Verify other fields remain unchanged
      expect(updated.isbn).to.equal(testCategory.isbn);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .patch('/categories/9')
        .send({genre: 'Updated'})
        .expect(404);
    });
  });

  describe('PUT /categories/{id}', () => {
    it('fully replaces a category by ID', async () => {
      const testCategory = testCategories[0];
      const replacement = {
        genre: 'Replaced Fiction',
        isbn: 9,
      };

      await client
        .put(`/categories/${testCategory.category_id}`)
        .send(replacement)
        .expect(204);

      const replaced = await categoryRepo.findById(testCategory.category_id);
      expect(replaced).to.containEql(replacement);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .put('/categories/9')
        .send({genre: 'New', isbn: 123})
        .expect(404);
    });

    it('returns 400 when missing required fields', async () => {
      const testCategory = testCategories[0];
      await client
        .put(`/categories/${testCategory.category_id}`)
        .send({genre: 'Incomplete'}) // Missing ISBN
        .expect(422);
    });
  });

  describe('DELETE /categories/{id}', () => {
    it('deletes a category by ID', async () => {
      const testCategory = testCategories[0];
      await client
        .delete(`/categories/${testCategory.category_id}`)
        .expect(204);

      await expect(
        categoryRepo.findById(testCategory.category_id)
      ).to.be.rejectedWith(/Entity not found: Category with id/);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .delete('/categories/9')
        .expect(404);
    });
  });

  describe('GET /categories/count', () => {
    it('returns total count of categories', async () => {
      const response = await client
        .get('/categories/count')
        .expect(200);

      expect(response.body).to.have.property('count', testCategories.length);
    });

    it('returns filtered count', async () => {
      const response = await client
        .get('/categories/count')
        .query({where: {genre: 'Fiction'}})
        .expect(200);

      expect(response.body.count).to.be.greaterThanOrEqual(1);
    });
  });
});