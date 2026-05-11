# LinkedIn Scraper Frontend

Angular + Material frontend service for visualizing scraped LinkedIn contacts stored in backend.

## Current Features

- Loads contacts from backend endpoint `GET /profiles`
- Displays list in a Material table
- Shows these fields:
	- Name
	- Location
	- Num Of Contacts
	- Info

## Configure Backend URL

Default backend URL is defined in:

- `src/environments/environment.ts`

```ts
export const environment = {
	backendBaseUrl: 'http://localhost:8080',
};
```

## Run Locally

From repository root:

```bash
cd apps/frontend
npm install
npm start
```

App is served on `http://localhost:4200`.

## Build

```bash
cd apps/frontend
npm run build
```

## Notes

- Backend must be running and reachable from browser.
- CORS is already enabled on backend side.
