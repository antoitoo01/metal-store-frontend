import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InvitationResponse, CreateInvitationRequest, Page } from '../../core/models/api.types';
import { SKIP_ORG } from '../../core/interceptors/organization.interceptor';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/organizations`;

  listInvitations(organizationId: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.http.get<Page<InvitationResponse>>(`${this.apiUrl}/${organizationId}/invitations?${params}`);
  }

  createInvitations(organizationId: string, body: CreateInvitationRequest) {
    return this.http.post<InvitationResponse[]>(`${this.apiUrl}/${organizationId}/invitations`, body);
  }

  cancelInvitation(organizationId: string, invitationId: string) {
    return this.http.delete<void>(`${this.apiUrl}/${organizationId}/invitations/${invitationId}`);
  }

  acceptInvitation(token: string) {
    return this.http.post<void>(`${environment.apiUrl}/api/invitations/accept`, { token }, {
      context: new HttpContext().set(SKIP_ORG, true),
    });
  }

  declineInvitation(token: string) {
    return this.http.post<void>(`${environment.apiUrl}/api/invitations/decline`, { token }, {
      context: new HttpContext().set(SKIP_ORG, true),
    });
  }
}
