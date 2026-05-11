import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ScrapedProfile {
  Name?: string;
  Location?: string;
  NumOfContacts?: string;
  Info?: string;
}

export interface ScrapedContact {
  profileUrl: string;
  name: string;
  location: string;
  numOfContacts: string;
  info: string;
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly http = inject(HttpClient);
  private readonly backendBaseUrl = environment.backendBaseUrl;

  getContacts(): Observable<ScrapedContact[]> {
    return this.http
      .get<Record<string, ScrapedProfile>>(`${this.backendBaseUrl}/profiles`)
      .pipe(
        map((profiles) =>
          Object.entries(profiles || {})
            .filter(([profileUrl]) => this.isProfileUrl(profileUrl))
            .map(([profileUrl, profile]) => ({
              profileUrl,
              name: this.pickText(profile.Name, '-'),
              location: this.pickText(profile.Location, '-'),
              numOfContacts: this.pickText(profile.NumOfContacts, '-'),
              info: this.pickText(profile.Info, '-'),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        )
      );
  }

  private isProfileUrl(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://');
  }

  private pickText(value: string | undefined, fallback: string): string {
    const normalized = String(value ?? '').trim();
    return normalized || fallback;
  }
}
