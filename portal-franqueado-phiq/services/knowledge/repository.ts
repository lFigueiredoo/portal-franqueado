import { databases } from '../../src/lib/appwrite/client';
import { APPWRITE_CONFIG } from '../../src/lib/appwrite/config';
import { Query } from 'appwrite';

export const knowledgeRepository = {
  async listCategories() {
    // In a real scenario, we might have a categories collection.
    // For now, we derive from the documents.
    const result = await databases.listDocuments({
      databaseId: APPWRITE_CONFIG.databaseId,
      collectionId: APPWRITE_CONFIG.collections.knowledge,
      queries: [Query.limit(100)]
    });
    const categories = [...new Set(result.documents.map(d => d.category))];
    return categories;
  },

  async listPages(category: string, parentId: string | null = null) {
    try {
      const queries = [Query.equal('published', true)];
      queries.push(Query.equal('category', category));

      if (parentId) {
        queries.push(Query.equal('parentPageId', parentId));
      } else {
        queries.push(Query.equal('parentPageId', 'null')); // Or handle root pages
      }

      queries.push(Query.orderAsc('order'));

      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.knowledge,
        queries: queries
      });
      return result.documents;
    } catch (error) {
      console.error('Error listing knowledge pages:', error);
      throw error;
    }
  },

  async getPage(id: string) {
    try {
      return await databases.getDocument({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.knowledge,
        documentId: id
      });
    } catch (error) {
      console.error('Error getting knowledge page:', error);
      throw error;
    }
  },

  async search(query: string) {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.knowledge,
        queries: [
          Query.search('content', query),
          Query.equal('published', true)
        ]
      });
      return result.documents;
    } catch (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }
  }
};
