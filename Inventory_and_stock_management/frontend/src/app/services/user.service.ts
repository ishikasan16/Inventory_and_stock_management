import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService, Paginated } from './api.service';
import { AppRole } from '../auth/utils/role-auth';

export interface User {
  id: string;
  username: string;
  email: string;
  // Inbound from the backend, so it is not narrowed to AppRole here: the value
  // is only used for display and comparison, never to grant access.
  role: string;
  created_at?: string | null;
}

export interface UserChangeRolePayload {
  role: AppRole;
}

export type UserQuery = {
  page?: number;
  pageSize?: number;
};

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET - List all users (super admin), paginated
  getUsers(query: UserQuery = {}): Observable<Paginated<User>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<User>>(
      this.buildUrl('users/'),
      { params }
    );
  }

  // GET - All users, across every page
  getAllUsers(): Observable<User[]> {
    return this.fetchAll<User>((page, pageSize) =>
      this.getUsers({ page, pageSize })
    );
  }

  // GET - List current manager's team, paginated
  getUsersTeam(query: UserQuery = {}): Observable<Paginated<User>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<User>>(
      this.buildUrl('users/team'),
      { params }
    );
  }

  // GET - Entire current manager's team
  getAllUsersTeam(): Observable<User[]> {
    return this.fetchAll<User>((page, pageSize) =>
      this.getUsersTeam({ page, pageSize })
    );
  }

  // PATCH - Change a user's role (super admin)
  changeRole(id: string, role: AppRole): Observable<User> {
    return this.http.patch<User>(
      this.buildUrl(`users/${id}/role`),
      { role } as UserChangeRolePayload
    );
  }
}