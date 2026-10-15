import { Client, Databases, Storage, ID } from 'node-appwrite';
import { APPWRITE_CONFIG } from '../../../src/lib/appwrite/config';
import type { Profile } from '@/types/portal';

// This is a server-side internal helper to initialize the Appwrite Server SDK
function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
}

export const serverTickets = {
  async createTicket(userId: string, profile: Profile, ticketData: Record<string, unknown>) {
    const client = createAdminClient();
    const databases = new Databases(client);

    // Protocol generation: Use the Appwrite Document ID as the base for uniqueness
    // But we'll generate the ID first to derive the protocol
    const docId = ID.unique();
    const protocol = `PHIQ-${new Date().getFullYear()}-${docId.slice(-6).toUpperCase()}`;

    const ticket = await databases.createDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.tickets,
        documentId: docId,
        data: {
          ...ticketData,
          protocol,
          createdBy: userId,
          franchiseId: profile.franchiseId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'Aberto',
          priority: (ticketData.priority as string) || 'Média',
        }
      }
    );

    return ticket;
  },

  async listTickets(userId: string, profile: Profile) {
    const client = createAdminClient();
    const databases = new Databases(client);
    const { Query } = await import('appwrite');

    const queries = [];
    if (profile.role === 'franchisee') {
      queries.push(Query.equal('franchiseId', profile.id));
    }
    // NAF/ADMIN can see all or we can filter by assigned franchise if implemented

    const result = await databases.listDocuments(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.tickets,
        queries: queries
      }
    );

    return result.documents;
  },

  async getTicket(ticketId: string, userId: string, profile: Profile) {
    const client = createAdminClient();
    const databases = new Databases(client);

    const ticket = await databases.getDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.tickets,
        documentId: ticketId
      }
    );

    // Isolation Check
    if (profile.role === 'franchisee' && ticket.franchiseId !== profile.id) {
      throw new Error('Unauthorized access to ticket');
    }

    return ticket;
  },

  async addMessage(ticketId: string, userId: string, profile: Profile, messageData: Record<string, unknown>) {
    const client = createAdminClient();
    const databases = new Databases(client);

    // Ensure user has access to the ticket
    await this.getTicket(ticketId, userId, profile);

    const message = await databases.createDocument({
      databaseId: APPWRITE_CONFIG.databaseId,
      collectionId: APPWRITE_CONFIG.collections.ticketMessages,
      documentId: ID.unique(),
      data: {
        ...messageData,
        ticketId,
        authorId: userId,
        createdAt: new Date().toISOString(),
        internal: profile.role === 'franchisee' ? false : (messageData.internal as boolean ?? false),
      }
    });

    return message;
  },

  async listMessages(ticketId: string, userId: string, profile: Profile) {
    const client = createAdminClient();
    const databases = new Databases(client);
    const { Query } = await import('appwrite');

    // Ensure access
    await this.getTicket(ticketId, userId, profile);

    const result = await databases.listDocuments(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.ticketMessages,
        queries: [
          Query.equal('ticketId', ticketId),
          Query.orderAsc('createdAt'),
        ]
      }
    );

    // Filter internal messages for FRANQUEADOS
    const docs = result.documents;
    if (profile.role === 'franchisee') {
      return docs.filter(m => !m.internal);
    }

    return docs;
  },

  async updateTicketStatus(ticketId: string, userId: string, profile: Profile, updates: Record<string, unknown>) {
    const client = createAdminClient();
    const databases = new Databases(client);

    if (profile.role === 'franchisee') {
      throw new Error('Franqueados cannot change ticket status');
    }

    const updated = await databases.updateDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.tickets,
        documentId: ticketId,
        data: {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      }
    );

    return updated;
  },

  async uploadAttachment(ticketId: string, userId: string, profile: Profile, file: File) {
    const client = createAdminClient();
    const databases = new Databases(client);
    const storage = new Storage(client);

    // Verify access
    await this.getTicket(ticketId, userId, profile);

    const uploadedFile = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.ticketAttachments,
      fileId: ID.unique(),
      file,
    });

    const attachment = await databases.createDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.ticketAttachments,
        documentId: ID.unique(),
        data: {
          ticketId,
          fileId: uploadedFile.$id,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedBy: userId,
          createdAt: new Date().toISOString(),
        }
      }
    );

    return attachment;
  }
};
