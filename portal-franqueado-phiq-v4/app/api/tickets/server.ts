import { Client, Databases, Storage, ID } from 'node-appwrite';
import { APPWRITE_CONFIG } from '../../src/lib/appwrite/config';

// This is a server-side internal helper to initialize the Appwrite Server SDK
function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
}

export const serverTickets = {
  async createTicket(userId: string, profile: any, ticketData: any) {
    const client = createAdminClient();
    const databases = new Databases(client);

    // Protocol generation: Use the Appwrite Document ID as the base for uniqueness
    // But we'll generate the ID first to derive the protocol
    const docId = ID.unique();
    const protocol = `PHIQ-${new Date().getFullYear()}-${docId.slice(-6).toUpperCase()}`;

    const ticket = await databases.createDocument(
      APPWRITE_CONFIG.collections.tickets,
      docId,
      {
        ...ticketData,
        protocol,
        createdBy: userId,
        franchiseId: profile.franchiseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Aberto',
        priority: ticketData.priority || 'Média',
      }
    );

    return ticket;
  },

  async listTickets(userId: string, profile: any) {
    const client = createAdminClient();
    const databases = new Databases(client);
    const { Query } = await import('appwrite');

    const queries = [];
    if (profile.role === 'FRANQUEADO') {
      queries.push(Query.equal('franchiseId', profile.franchiseId));
    }
    // NAF/ADMIN can see all or we can filter by assigned franchise if implemented

    const result = await databases.listDocuments(
      APPWRITE_CONFIG.collections.tickets,
      queries
    );

    return result.documents;
  },

  async getTicket(ticketId: string, userId: string, profile: any) {
    const client = createAdminClient();
    const databases = new Databases(client);

    const ticket = await databases.getDocument(
      APPWRITE_CONFIG.collections.tickets,
      ticketId
    );

    // Isolation Check
    if (profile.role === 'FRANQUEADO' && ticket.franchiseId !== profile.franchiseId) {
      throw new Error('Unauthorized access to ticket');
    }

    return ticket;
  },

  async addMessage(ticketId: string, userId: string, profile: any, messageData: any) {
    const client = createAdminClient();
    const databases = new Databases(client);

    // Ensure user has access to the ticket
    const ticket = await this.getTicket(ticketId, userId, profile);

    const message = await databases.createDocument(
      APPWRITE_CONFIG.collections.ticketMessages,
      ID.unique(),
      {
        ...messageData,
        ticketId,
        authorId: userId,
        createdAt: new Date().toISOString(),
        // Prevent FRANQUEADO from setting internal=true
        internal: profile.role === 'FRANQUEADO' ? false : (messageData.internal ?? false),
      }
    );

    return message;
  },

  async listMessages(ticketId: string, userId: string, profile: any) {
    const client = createAdminClient();
    const databases = new Databases(client);
    const { Query } = await import('appwrite');

    // Ensure access
    await this.getTicket(ticketId, userId, profile);

    const result = await databases.listDocuments(
      APPWRITE_CONFIG.collections.ticketMessages,
      [
        Query.equal('ticketId', ticketId),
        Query.orderAsc('createdAt'),
      ]
    );

    // Filter internal messages for FRANQUEADOS
    const docs = result.documents;
    if (profile.role === 'FRANQUEADO') {
      return docs.filter(m => !m.internal);
    }

    return docs;
  },

  async updateTicketStatus(ticketId: string, userId: string, profile: any, updates: any) {
    const client = createAdminClient();
    const databases = new Databases(client);

    if (profile.role === 'FRANQUEADO') {
      throw new Error('Franqueados cannot change ticket status');
    }

    const updated = await databases.updateDocument(
      APPWRITE_CONFIG.collections.tickets,
      ticketId,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );

    return updated;
  },

  async uploadAttachment(ticketId: string, userId: string, profile: any, file: any) {
    const client = createAdminClient();
    const databases = new Databases(client);
    const storage = new Storage(client);

    // Verify access
    await this.getTicket(ticketId, userId, profile);

    const uploadedFile = await storage.createFile(
      APPWRITE_CONFIG.buckets.ticketAttachments,
      ID.unique(),
      file
    );

    const attachment = await databases.createDocument(
      APPWRITE_CONFIG.collections.ticketAttachments,
      ID.unique(),
      {
        ticketId,
        fileId: uploadedFile.$id,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedBy: userId,
        createdAt: new Date().toISOString(),
      }
    );

    return attachment;
  }
};
