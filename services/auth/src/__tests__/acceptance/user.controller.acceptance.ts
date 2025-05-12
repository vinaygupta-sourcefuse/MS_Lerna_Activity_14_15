import {Client, expect} from '@loopback/testlab';
import {AuthApplication} from '../../application';
import {setupApplication} from './test-helper';
import {UserRepository} from '../../repositories';
import {User} from '../../models';

describe('UserController', () => {
  let app: AuthApplication;
  let client: Client;
  let userRepo: UserRepository;
  let testUsers: User[];

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    userRepo = await app.getRepository(UserRepository);
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await userRepo.deleteAll();
    testUsers = await createTestUsers();
  });

  async function createTestUsers(): Promise<User[]> {
    return Promise.all([
      userRepo.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'securepassword',
        role: 'admin'
      }),
      userRepo.create({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'userpassword',
        role: 'user'
      }),
      userRepo.create({
        name: 'Editor User',
        email: 'editor@example.com',
        password: 'editorpass',
        role: 'editor'
      })
    ]);
  }

  describe('POST /users', () => {
    it('creates a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'user'
      };

      const response = await client
        .post('/users')
        .send(newUser)
        .expect(200);

      expect(response.body).to.containEql(newUser);
      expect(response.body).to.have.property('user_id');
      expect(response.body.user_id).to.be.a.Number();

      // Verify the user was actually saved
      const found = await userRepo.findById(response.body.user_id);
      expect(found).to.containEql(newUser);
    });

    it('rejects request with missing required fields', async () => {
      const invalidUser = {
        name: 'Incomplete User',
        email: 'incomplete@example.com',
        // Missing password and role
      };

      await client
        .post('/users')
        .send(invalidUser)
        .expect(422);
    });

  });

  describe('GET /users', () => {
    it('returns all users with default pagination', async () => {
      const response = await client
        .get('/users')
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(testUsers.length);
      testUsers.forEach(expectedUser => {
        expect(response.body).to.containDeep([expectedUser]);
      });
    });

    it('supports filtering by role', async () => {
      const response = await client
        .get('/users')
        .query({filter: {where: {role: 'admin'}}})
        .expect(200);

      expect(response.body).to.be.an.Array();
      expect(response.body).to.have.length(1);
      expect(response.body[0].role).to.equal('admin');
    });

    it('supports pagination', async () => {
      const response = await client
        .get('/users')
        .query({filter: {limit: 2}})
        .expect(200);

      expect(response.body).to.have.length(2);
    });
  });

  describe('GET /users/{id}', () => {
    it('returns a user by ID', async () => {
      const testUser = testUsers[0];
      const response = await client
        .get(`/users/${testUser.user_id}`)
        .expect(200);

      expect(response.body).to.containEql(testUser);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .get('/users/999999')
        .expect(404);
    });
  });

  describe('PATCH /users/{id}', () => {
    it('updates a user partially', async () => {
      const testUser = testUsers[0];
      const updateData = {
        name: 'Updated Admin User',
        role: 'superadmin'
      };

      await client
        .patch(`/users/${testUser.user_id}`)
        .send(updateData)
        .expect(204);

      const updated = await userRepo.findById(testUser.user_id);
      expect(updated.name).to.equal(updateData.name);
      expect(updated.role).to.equal(updateData.role);
      // Verify other fields remain unchanged
      expect(updated.email).to.equal(testUser.email);
    });

    it('returns 404 for non-existent ID', async () => {
      await client
        .patch('/users/999999')
        .send({name: 'Updated'})
        .expect(404);
    });
  });

  describe('PUT /users/{id}', () => {
    it('replaces entire user', async () => {
      const testUser = testUsers[0];
      const replacement = {
        name: 'Completely New User',
        email: 'new@example.com',
        password: 'newpassword',
        role: 'user'
      };

      await client
        .put(`/users/${testUser.user_id}`)
        .send(replacement)
        .expect(204);

      const replaced = await userRepo.findById(testUser.user_id);
      expect(replaced).to.containEql(replacement);
    });

    it('returns 400 when missing required fields', async () => {
      const testUser = testUsers[0];
      await client
        .put(`/users/${testUser.user_id}`)
        .send({
          name: 'Incomplete User',
          email: 'incomplete@example.com'
          // Missing password and role
        })
        .expect(422);
    });
  });

  describe('DELETE /users/{id}', () => {
    it('returns 404 for non-existent ID', async () => {
      await client
        .delete('/users/999999')
        .expect(404);
    });
  });

  describe('GET /users/count', () => {
    it('returns total count of users', async () => {
      const response = await client
        .get('/users/count')
        .expect(200);

      expect(response.body).to.have.property('count', testUsers.length);
    });

    it('returns filtered count', async () => {
      const response = await client
        .get('/users/count')
        .query({where: {role: 'user'}})
        .expect(200);

      expect(response.body.count).to.be.greaterThanOrEqual(1);
    });
  });

  describe('PATCH /users', () => {
    it('updates multiple users', async () => {
      const where = {role: 'user'};
      const updateData = {role: 'subscriber'};

      const response = await client
        .patch('/users')
        .query({where})
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('count', 1);

      const updatedUsers = await userRepo.find({where: {role: 'subscriber'}});
      expect(updatedUsers).to.have.length(1);
    });
  });
});