import { databases, storage } from '../../src/lib/appwrite/client';
import { APPWRITE_CONFIG } from '../../src/lib/appwrite/config';
import { Query } from 'appwrite';

export const communicationsRepository = {
  async listPublished() {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        queries: [
          Query.equal('published', true),
          Query.orderDesc('publishedAt')
        ]
      });
      return result.documents;
    } catch (error) {
      console.error('Error listing communications:', error);
      throw error;
    }
  },

  async getCommunication(id: string) {
    try {
      return await databases.getDocument({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        documentId: id
      });
    } catch (error) {
      console.error('Error getting communication:', error);
      throw error;
    }
  },

  async listByCategory(category: string) {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        queries: [
          Query.equal('published', true),
          Query.equal('category', category),
          Query.orderDesc('publishedAt')
        ]
      });
      return result.documents;
    } catch (error) {
      console.error('Error listing communications by category:', error);
      throw error;
    }
  },

  async listFeatured() {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        queries: [
          Query.equal('published', true),
          Query.equal('featured', true),
          Query.limit(5)
        ]
      });
      return result.documents;
    } catch (error) {
      console.error('Error listing featured communications:', error);
      throw error;
    }
  }
};
