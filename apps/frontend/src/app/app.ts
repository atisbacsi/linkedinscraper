import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ContactsService, ScrapedContact } from './services/contacts.service';

@Component({
  selector: 'app-root',
  imports: [MatCardModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly contactsService = inject(ContactsService);

  contacts: ScrapedContact[] = [];
  displayedColumns: string[] = ['name', 'location', 'numOfContacts', 'info'];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.contactsService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerult betolteni a kontakt listat a backendrol.';
        this.loading = false;
      },
    });
  }
}
