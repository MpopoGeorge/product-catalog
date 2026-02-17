import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../app.config';

const TOKEN_KEY = 'product_catalog_token';
const USER_KEY = 'product_catalog_user';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${API_BASE_URL}/api/auth`;
  private currentUser$ = new BehaviorSubject<{ username: string; role: string } | null>(this.getStoredUser());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse | null> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(TOKEN_KEY, res.token);
          const user = { username: res.username, role: res.role };
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUser$.next(user);
        }
      }),
      catchError(() => of(null))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): BehaviorSubject<{ username: string; role: string } | null> {
    return this.currentUser$;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getStoredUser(): { username: string; role: string } | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { username: string; role: string };
    } catch {
      return null;
    }
  }
}
