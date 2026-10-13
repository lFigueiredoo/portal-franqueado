import { ticketsRepository } from './repository';

/**
 * This service now communicates with Route Handlers (API)
 * to ensure all security checks happen on the server.
 */
export const ticketsService = {
  async createTicket(ticketData: any, userId: string, profile: any) {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile, data: ticketData }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao criar chamado');
    }

    return response.json();
  },

  async listMyTickets(franchiseId: string, role: string, userId: string) {
    const params = new URLSearchParams({ userId, franchiseId, role });
    const response = await fetch(`/api/tickets?${params.toString()}`);

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao listar chamados');
    }

    return response.json();
  },

  async getTicket(ticketId: string) {
    return ticketsRepository.getTicket(ticketId);
  },

  async listMessages(ticketId: string, userId: string, profile: any) {
    const params = new URLSearchParams({ ticketId, userId, franchiseId: profile.franchiseId, role: profile.role });
    const response = await fetch(`/api/tickets/messages?${params.toString()}`);

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao listar mensagens');
    }

    return response.json();
  },

  async addMessage(ticketId: string, userId: string, message: string, profile: any) {
    const response = await fetch('/api/tickets/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, userId, profile, message }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao enviar mensagem');
    }

    return response.json();
  },

  async uploadAttachment(ticketId: string, file: File, userId: string, profile: any) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);
    formData.append('userId', userId);
    formData.append('franchiseId', profile.franchiseId);
    formData.append('role', profile.role);

    const response = await fetch('/api/tickets/attachments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao anexar arquivo');
    }

    return response.json();
  },

  async updateStatus(ticketId: string, status: string, userId: string, profile: any) {
    const response = await fetch('/api/tickets/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, userId, profile, status }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao atualizar status');
    }

    return response.json();
  },

  async downloadAttachment(fileId: string) {
    throw new Error('Download requires authenticated storage access');
  }
};
