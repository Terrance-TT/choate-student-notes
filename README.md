# Choate Student Notes

A public, mobile-first announcement reader for **Choate Rosemary Hall** — replacing the sign-in-gated Communications portal page with an open, glanceable feed students can read in under 60 seconds.

**No sign-in is ever required to read announcements.**

## Features

- **Public feed** — students open the link and read immediately; no authentication on any read path
- **Summary card** (home) — every announcement title at a glance, comma-separated, each tappable to expand the full note
- **Digest** (`/digest`) — title + one-sentence summary per announcement; optional **AI digest** via any OpenAI-compatible API (configure base URL / key / model in `/settings` — the key stays in the browser and is only sent to your configured endpoint). Without a key, a deterministic local summarizer keeps the digest working. "Show all" expands every announcement full-text inline.
- **Departments** (`/departments`) — browse by department (Student Activities, Clubs & Organizations, Arts, Athletics, …) with an archive
- **Submission flow** (`/submit`) — faculty compose announcements (department, tags, markdown-lite body, image, live preview)
- **Moderation queue** (`/admin`) — an admin approves or rejects submissions before they go live
- **Mobile-first** — designed phone-first (390×844), bottom tab bar, drag-to-dismiss detail sheets; desktop shows the app in a centered phone shell

## Demo accounts

Authentication is a **modular stub** so the app is fully testable before school IT connects real sign-in:

| Demo account | Can do |
|---|---|
| **Demo Faculty** | Submit announcements (they enter the review queue as *pending*) |
| **Demo Admin** | Approve/reject pending submissions at `/admin` — approved notes appear in the feed instantly |

Switch between accounts with the **Switch account** button on the Submit page.

## Connecting Microsoft sign-in (for school IT)

The school uses Microsoft. Auth is isolated behind a single interface — **`src/lib/auth.ts`**:

```ts
interface AuthProvider {
  signIn(role?): Promise<User>;
  signOut(): Promise<void>;
  getUser(): User | null;
}
```

To go production (also documented in-app at `/about#it`):

1. Register a SPA app in **Microsoft Entra ID** (Azure portal → App registrations), redirect URI = this site's URL
2. `npm install @azure/msal-browser`
3. Implement `AuthProvider` with `PublicClientApplication` (`loginPopup`/`loginRedirect`, scopes `["User.Read"]`)
4. Derive the `admin` role from an Entra **security-group claim** (e.g. "Communications Office")
5. Swap one line: `setAuthProvider(new MsalAuthProvider(...))` — the submit form and admin queue UI stay unchanged

No Microsoft code ships in this repo by design.

## Data

Currently frontend-only: seed announcements live in `src/data/announcements.ts`; submissions and approvals persist in the browser's `localStorage`. For multi-device persistence (a real shared queue), add a backend of your choice — the moderation/data layer is isolated in `src/lib/submissions.ts`.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion · GSAP · Lenis

## Run locally

```bash
npm install
npm run dev      # dev server
npm run build    # production build → dist/
```

## Notes

- Image assets are inlined as base64 data URIs (`src/assets/img-*.ts`) — the repository is intentionally text-only.
- `package-lock.json` is not committed; `npm install` regenerates it.
