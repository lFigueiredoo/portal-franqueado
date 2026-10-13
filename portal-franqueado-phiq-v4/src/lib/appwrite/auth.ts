import { account } from './client';
import { ID } from 'appwrite';

export const appwriteAuth = {
  async login(email: string, pass: string) {
    try {
      return await account.createEmailPasswordSession(email, pass);
    } catch (error) {
      console.error('Appwrite Login Error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      return await account.deleteSession('current');
    } catch (error) {
      console.error('Appwrite Logout Error:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  async createAccount(email: string, pass: string, name: string) {
    try {
      return await account.create(
        ID.unique(),
        email,
        pass,
        name
      );
    } catch (error) {
      console.error('Appwrite Create Account Error:', error);
      throw error;
    }
  }
};
