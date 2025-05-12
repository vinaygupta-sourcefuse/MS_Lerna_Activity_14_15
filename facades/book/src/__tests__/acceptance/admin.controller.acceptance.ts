import {expect} from '@loopback/testlab';
import sinon from 'sinon';
import axios from 'axios';
import {UserController} from '../../controllers/admin.controller';
import {Signup} from '../../models/user';

describe('UserController Unit Tests', () => {
  let controller: UserController;
  const baseURL = 'http://localhost:3011';

  const mockUser: Signup = {
    id: 1,
    name: 'testuser',
    email: 'test@example.com',
    password: 'testpass',
    role: 'user',
  };

  beforeEach(() => {
    controller = new UserController();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAllUser()', () => {
    it('should return a list of users', async () => {
      const axiosStub = sinon.stub(axios, 'get').resolves({data: [mockUser]});
      const result = await controller.getAllUser();
      expect(result).to.deepEqual([mockUser]);
      sinon.assert.calledWithExactly(axiosStub, `${baseURL}/users`);
    });

  
    it('should handle axios internal error', async () => {
      sinon.stub(axios, 'get').rejects(new Error('DB down'));
      try {
        await controller.getAllUser();
      } catch (err: any) {
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.match(/Failed to get all users/);
      }
    });
  });

  describe('createUser()', () => {
    it('should create a new user with role user', async () => {
      const userInput = {...mockUser, role: 'admin' as 'user' | 'admin' | 'unknown'};
      const expected = {...mockUser, role: 'user'};
      const axiosStub = sinon.stub(axios, 'post').resolves({data: expected});

      const result = await controller.createUser(userInput);
      expect(result).to.deepEqual(expected);
      sinon.assert.calledWithExactly(axiosStub, `${baseURL}/users`, {
        ...userInput,
        role: 'user',
      });
    });

    it('should throw InternalServerError when creation fails', async () => {
      sinon.stub(axios, 'post').rejects(new Error('Something broke'));
      try {
        await controller.createUser(mockUser);
      } catch (err: any) {
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.match(/Failed to create user/);
      }
    });
  });

  describe('createAdmin()', () => {
    it('should create a new admin user with role admin', async () => {
      const userInput = {...mockUser, role: 'user'};
      const expected = {...mockUser, role: 'admin'};
      const axiosStub = sinon.stub(axios, 'post').resolves({data: expected});

      const result = await controller.createAdmin({...userInput, role: 'admin' as 'user' | 'admin' | 'unknown'});
      expect(result).to.deepEqual(expected);
      sinon.assert.calledWithExactly(axiosStub, `${baseURL}/users`, {
        ...userInput,
        role: 'admin',
      });
    });

    it('should throw InternalServerError when admin creation fails', async () => {
      sinon.stub(axios, 'post').rejects(new Error('Admin creation failed'));
      try {
        await controller.createAdmin(mockUser);
      } catch (err: any) {
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.match(/Failed to create user/);
      }
    });
  });

  describe('deleteById()', () => {
    it('should return success message when user is deleted', async () => {
      const axiosStub = sinon.stub(axios, 'delete').resolves({status: 204});
      const result = await controller.deleteById(1);
      expect(result).to.deepEqual({
        message: `User with id 1 has been deleted successfully.`,
      });
      sinon.assert.calledWithExactly(axiosStub, `${baseURL}/users/1`);
    });

   

    it('should throw InternalServerError for unknown delete error', async () => {
      sinon.stub(axios, 'delete').rejects(new Error('Unexpected fail'));
      try {
        await controller.deleteById(3);
      } catch (err: any) {
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.match(/Failed to delete user/);
      }
    });
  });
});