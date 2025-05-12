import {expect} from '@loopback/testlab';
import sinon from 'sinon';
import axios from 'axios';
import {AuthController} from '../../controllers/user.facade.controller';
import {Signup, Login, Token} from '../../models/user';

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(() => {
    authController = new AuthController();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should handle user signup failure', async () => {
    const axiosPostStub: sinon.SinonStub = sinon.stub(axios, 'post');
    const userData: Signup = {
      name: 'testuser',
      password: 'testpass',
      email: 'fail@example.com',
      role: 'user',
    };

    const error = new Error('Signup failed');
    (error as any).response = {status: 400, data: {error: 'Invalid'}};
    axiosPostStub.rejects(error);

    await expect(authController.signupUser(userData, {} as any)).to.be.rejectedWith(
      'Signup processing failed',
    );
    sinon.assert.calledWithExactly(
      axiosPostStub,
      'http://localhost:3011/signup',
      {...userData, role: 'user'},
    );
  });

  it('should handle login failure', async () => {
    const axiosPostStub: sinon.SinonStub = sinon.stub(axios, 'post');

    const credentials: Login = {
      name: 'testuser',
      password: 'wrongpass',
    };

    const error = new Error('Login failed');
    (error as any).response = {status: 401, data: {error: 'Unauthorized'}};
    axiosPostStub.rejects(error);

    await expect(authController.login(credentials, {} as any)).to.be.rejectedWith(
      'Login processing failed',
    );
    sinon.assert.calledWithExactly(
      axiosPostStub,
      'http://localhost:3011/login',
      credentials,
    );
  });

  it('should handle logout failure', async () => {
    const axiosPostStub: sinon.SinonStub = sinon.stub(axios, 'post');

    const logoutData = {refreshToken: 'invalid-refresh-token'};

    const error = new Error('Logout failed');
    (error as any).response = {status: 401, data: {error: 'Unauthorized'}};
    axiosPostStub.rejects(error);

    await expect(authController.logout(logoutData, {} as any)).to.be.rejectedWith(
      'Logout processing failed',
    );
    sinon.assert.calledWithExactly(
      axiosPostStub,
      'http://localhost:3011/logout',
      logoutData,
    );
  });
});