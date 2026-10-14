import { Client, Account, Databases, Storage } from 'node-appwrite';
import { APPWRITE_CONFIG } from './config';

export const createAdminClient = () => {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setKey(process.env.APPWRITE_API_KEY || '');

  return {
    get account() { return new Account(client); },
    get databases() { return new Databases(client); },
    get storage() { return new Storage(client); },
    client,
  };
};
