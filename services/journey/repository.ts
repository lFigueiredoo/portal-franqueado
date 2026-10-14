import { databases } from '@/src/lib/appwrite/client';
import { APPWRITE_CONFIG } from '@/src/lib/appwrite/config';
import { Query } from 'appwrite';

export const journeyRepository = {
  async getProgress(franchiseId: string) {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.journeyProgress,
        queries: [Query.equal('franchiseId', franchiseId)]
      });
      return result.documents[0];
    } catch (error) {
      console.error('Error fetching journey progress:', error);
      throw error;
    }
  },

  async getMilestones(level: number) {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.journeyMilestones,
        queries: [
          Query.equal('level', level),
          Query.orderAsc('order')
        ]
      });
      return result.documents;
    } catch (error) {
      console.error('Error fetching milestones:', error);
      throw error;
    }
  },

  async getMilestoneProgress(franchiseId: string) {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
        queries: [Query.equal('franchiseId', franchiseId)]
      });
      return result.documents;
    } catch (error) {
      console.error('Error fetching milestone progress:', error);
      throw error;
    }
  }
};
