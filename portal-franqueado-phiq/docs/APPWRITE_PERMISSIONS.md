# Appwrite Permissions Model - Portal do Franqueado PHIQ

## 1. General Strategy: Hybrid Model
We use a combination of **Appwrite Teams** for global roles and **Document-Level Permissions** for data isolation between franchises.

### Global Roles (Teams)
- `team:admin`: Full access to all network resources.
- `team:naf`: Access to units and tickets assigned to the CS/NAF user.
- `team:franchisee`: (Implicit) Users not in admin/naf teams. Access is restricted to their own document IDs.

## 2. Collection Permissions Matrix

| Collection | Permission Type | Read | Write/Update | Note |
| :--- | :--- | :--- | :--- | :--- |
| `Profiles` | Document Level | `user:[USER_ID]`, `team:admin` | `team:admin` | User can read their own profile. Only Admin can change role/active status. |
| `Franchises` | Document Level | `user:[USER_ID]`, `team:naf`, `team:admin` | `team:admin` | CS/NAF access is granted per document for assigned units. |
| `Tickets` | Document Level | `user:[USER_ID]`, `team:naf`, `team:admin` | `team:admin`, `team:naf` | Franqueado can create, but not update ticket status. |
| `TicketMessages` | Document Level | `user:[USER_ID]`, `team:naf`, `team:admin` | `user:[USER_ID]`, `team:naf`, `team:admin` | Internal notes are filtered at the Service layer (Server-side). |
| `TicketAttachments` | Document Level | `user:[USER_ID]`, `team:naf`, `team:admin` | `user:[USER_ID]`, `team:naf`, `team:admin` | Permissions mirror the parent Ticket. |

## 3. Server-Side Enforcement
All sensitive operations MUST go through Server Actions/Route Handlers.

**Verification Flow:**
1. **Identify**: Get session from cookie -> `appwrite.account.get()`.
2. **Authorize**: Fetch Profile from `Profiles` collection.
3. **Validate**:
   - `changeStatus`: Verify `profile.role` is `ADMIN` or `CS`.
   - `accessTicket`: Verify `ticket.unitId` matches `profile.franchiseId` OR user is `ADMIN`/`CS`.
   - `addInternalMessage`: Verify `profile.role` is NOT `FRANQUEADO`.

## 4. Storage Buckets
- `ticket-attachments`: Read: Document participants. Write: Document participants.
- `knowledge-files`: Read: Any Auth. Write: `team:admin`.
- `product-documents`: Read: Any Auth. Write: `team:admin`.
- `communication-media`: Read: Any Auth. Write: `team:admin`.
