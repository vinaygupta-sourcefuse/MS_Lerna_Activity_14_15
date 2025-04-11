import {
  get,
  post,
  response,
  requestBody,
  HttpErrors,
  param,
  del,
} from '@loopback/rest';
import axios from 'axios';

/* Book Interface */
import {Signup} from '../models/user';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {PermissionKey} from '../utils/permissionsKeys';

export class UserController {
  private userBaseURL = 'http://localhost:3011';

  constructor() {}

  /* Auth End Points */
  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKey.ViewUser]})
  @get('/users')
  async getAllUser(): Promise<Signup[]> {
    try {
      const response = await axios.get(`${this.userBaseURL}/users`);
      const users: Signup[] = response.data;
      if (!users || users.length === 0) {
        throw new HttpErrors.NotFound('No users found.');
      }
      return users;
    } catch (error) {
      console.error('Error during GetAllUsers:', error.message);
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 404) {
          throw new HttpErrors.NotFound('No users found.');
        }
        throw new HttpErrors.InternalServerError(
          `Failed to get all users: ${error.message}`,
        );
      }
      throw new HttpErrors.InternalServerError('Failed to get all users');
    }
  }

    @authenticate(STRATEGY.BEARER)
    @authorize({permissions: [PermissionKey.DeleteUser]})
  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(
    @param.path.number('id') id: number,
  ): Promise<{message: string}> {
    try {
      const response = await axios.delete(`${this.userBaseURL}/users/${id}`);
      if (response.status === 204) {
        return {message: `User with id ${id} has been deleted successfully.`};
      }
      throw new HttpErrors.InternalServerError(
        `Failed to delete user with ID ${id}.`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 404) {
          throw new HttpErrors.NotFound(`User with ID ${id} not found.`);
        }
        throw new HttpErrors.InternalServerError(
          `Failed to delete user with ID ${id}: ${error.message}`,
        );
      }
      throw new HttpErrors.InternalServerError(
        `Failed to delete user with ID ${id}: ${error.message}`,
      );
    }
  }

  @post('/users')
  async createUser(@requestBody() userData: Signup): Promise<Signup> {
    try {
      userData.role = 'user'; // Ensure the role is fixed to "user"
      const response = await axios.post(`${this.userBaseURL}/users`, userData);
      const createdUser: Signup = response.data;
      if (!createdUser) {
        throw new HttpErrors.InternalServerError('Failed to create user.');
      }
      return createdUser;
    } catch (error) {
      console.error('Error during CreateUser:', error.message);
      throw new HttpErrors.InternalServerError('Failed to create user');
    }
  }

  @post('/admin')
  async createAdmin(@requestBody() userData: Signup): Promise<Signup> {
    try {
      userData.role = 'admin'; // Ensure the role is fixed to "user"
      const response = await axios.post(`${this.userBaseURL}/users`, userData);
      const createdUser: Signup = response.data;
      if (!createdUser) {
        throw new HttpErrors.InternalServerError('Failed to create user.');
      }
      return createdUser;
    } catch (error) {
      console.error('Error during CreateUser:', error.message);
      throw new HttpErrors.InternalServerError('Failed to create user');
    }
  }
}
