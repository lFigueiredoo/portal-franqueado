import { databases, storage } from '@/src/lib/appwrite/client';
import { APPWRITE_CONFIG } from '@/src/lib/appwrite/config';
import { Models, Query, ID } from 'appwrite';

type Ticket = Models.Document;
type TicketMessage = Models.Document;
type TicketAttachment = Models.Document;

export const ticketsRepository = {
  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: Partial<Ticket>) {
    try {
      const ticket = await databases.createDocument(
        {
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.tickets,
          documentId: ID.unique(),
          data: {
            ...ticketData,
            protocol: `PHIQ-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      );
      return ticket as Ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  /**
   * List tickets for the current franchise/user
   */
  async listMyTickets(franchiseId: string, role: 'ADMIN' | 'NAF' | 'FRANQUEADO') {
    try {
      const queries: string[] = [];

      if (role === 'FRANQUEADO') {
        queries.push(Query.equal('franchiseId', franchiseId));
      }
      // ADMIN and NAF can see all tickets (handled by Appwrite permissions,
      // but we can add filters here if needed)

      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.tickets,
        queries,
      });

      return result.documents as Ticket[];
    } catch (error) {
      console.error('Error listing tickets:', error);
      throw error;
    }
  },

  /**
   * Get a single ticket by ID
   */
  async getTicket(ticketId: string) {
    try {
      const ticket = await databases.getDocument({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.tickets,
        documentId: ticketId
      });
      return ticket as Ticket;
    } catch (error) {
      console.error('Error getting ticket:', error);
      throw error;
    }
  },

  /**
   * List all messages for a specific ticket
   */
  async listTicketMessages(ticketId: string) {
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.ticketMessages,
        queries: [
          Query.equal('ticketId', ticketId),
          Query.orderAsc('createdAt')
        ],
      });
      return result.documents as TicketMessage[];
    } catch (error) {
      console.error('Error listing messages:', error);
      throw error;
    }
  },

  /**
   * Add a message to a ticket
   */
  async addTicketMessage(messageData: Partial<TicketMessage>) {
    try {
      const message = await databases.createDocument(
        {
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.ticketMessages,
          documentId: ID.unique(),
          data: {
            ...messageData,
            createdAt: new Date().toISOString(),
          }
        }
      );
      return message as TicketMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  /**
   * Upload an attachment to a ticket
   */
  async uploadAttachment(ticketId: string, file: File, userId: string) {
    try {
      // 1. Upload file to bucket
      const uploadedFile = await storage.createFile(
        APPWRITE_CONFIG.buckets.ticketAttachments,
        ID.unique(),
        file
      );

      // 2. Create record in ticket_attachments collection
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

      return attachment as TicketAttachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  },

  /**
   * Update ticket status or priority
   */
  async updateTicket(ticketId: string, updates: Partial<Ticket>) {
    try {
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
      return updated as Ticket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }
};
