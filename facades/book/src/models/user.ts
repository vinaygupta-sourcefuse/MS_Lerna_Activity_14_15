export interface Signup {
  id?: string | number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'unknown';
  }
  
  export interface Login {
    name: string;
    password: string;
  }
  
  export interface Token {
    accessToken: string;
    refreshToken: string;
}
  
  export interface User {
    id?: string;
    username: string;
    email: string;
    password: string;
    role: string;
    permissions?: string[];
  }