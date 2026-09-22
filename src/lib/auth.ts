/**
 * Authentication stub — design.md §9.
 *
 * =============================================================================
 * SCHOOL IT INTEGRATION GUIDE — MICROSOFT ENTRA ID (Azure AD) SWAP PATH
 * =============================================================================
 * Reading announcements is ALWAYS public. The only gated surfaces are the
 * Submit flow (/submit, any signed-in role) and the Admin review queue
 * (/admin, role "admin"), both guarding on `getUser()` below.
 *
 * To connect Choate's real identity system, implement the `AuthProvider`
 * interface with Microsoft Entra ID and pass your implementation to
 * `setAuthProvider()` (e.g. in `src/main.tsx`):
 *
 *   1.  npm install @azure/msal-browser
 *   2.  Register an app in Entra ID (single-tenant, Choate's directory).
 *       Redirect URI: https://<your-host>/submit (SPA platform).
 *   3.  Implement AuthProvider with PublicClientApplication:
 *
 *       import { PublicClientApplication } from "@azure/msal-browser";
 *
 *       const msal = new PublicClientApplication({
 *         auth: {
 *           clientId: "<entra-app-client-id>",
 *           authority: "https://login.microsoftonline.com/<choate-tenant-id>",
 *           redirectUri: window.location.origin + "/submit",
 *         },
 *       });
 *
 *       const ADMIN_GROUP_ID = "<communications-office-security-group-id>";
 *
 *       const entraProvider: AuthProvider = {
 *         // NOTE: the optional `role` parameter is a DEMO-ONLY affordance.
 *         // The real provider ignores it — role is derived from the user's
 *         // Entra ID security-group claims after sign-in (see below).
 *         async signIn() {
 *           const res = await msal.loginPopup({ scopes: ["User.Read"] });
 *           const claims = res.idTokenClaims;
 *           // Recommended: authorize via group membership claims — members of
 *           // the "Communications Office" security group get role "admin"
 *           // (they moderate /admin), everyone else in the directory is
 *           // "faculty". The Admin page needs no changes when this lands.
 *           const groups = (claims?.groups as string[]) ?? [];
 *           const role: UserRole = groups.includes(ADMIN_GROUP_ID) ? "admin" : "faculty";
 *           return { id: res.account.localAccountId, name: res.account.name ?? "",
 *                    email: res.account.username, role };
 *         },
 *         async signOut() { await msal.logoutPopup(); },
 *         getUser() {
 *           const acct = msal.getActiveAccount();
 *           // Same group-claim derivation as signIn (read the cached token).
 *           return acct ? { id: acct.localAccountId, name: acct.name ?? "",
 *                           email: acct.username, role: "faculty" } : null;
 *         },
 *       };
 *       setAuthProvider(entraProvider);
 *
 *   NO Microsoft code ships in this repo — only this interface and these docs.
 * =============================================================================
 */

/** Authorization role. "admin" = Communications Office moderation queue. */
export type UserRole = "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  /**
   * Authorization role. Demo provider: chosen on the stub sign-in screen.
   * Real Entra ID provider: derived from security-group claims (see guide).
   */
  role: UserRole;
}

export interface AuthProvider {
  /**
   * Interactive sign-in. Resolves with the signed-in user.
   * The optional `role` is honored by the DemoAuthProvider only; a real
   * MSAL/Entra implementation MUST ignore it and derive role from group
   * claims instead.
   */
  signIn(role?: UserRole): Promise<User>;
  signOut(): Promise<void>;
  /** Currently signed-in user, or null. Must be synchronous + cheap. */
  getUser(): User | null;
}

const LS_DEMO_USER = "student-notes.demoUser";

/**
 * DemoAuthProvider — placeholder so the submit form and the admin review
 * queue are testable today. Two demo identities exist — "Demo Faculty"
 * (submits announcements) and "Demo Admin" (approves them on /admin) — so
 * the full submit → review → publish loop can be rehearsed without a
 * backend. Persists the chosen fake user to localStorage on "sign in".
 * Replace with the Entra ID implementation above before production rollout
 * (role then comes from group claims, not from a button).
 */
export class DemoAuthProvider implements AuthProvider {
  async signIn(role: UserRole = "faculty"): Promise<User> {
    // Simulate a network round-trip to an identity provider.
    await new Promise((r) => setTimeout(r, 600));
    const user: User =
      role === "admin"
        ? {
            id: "demo-admin-1",
            name: "Demo Admin",
            email: "admin.demo@choate.edu",
            role: "admin",
          }
        : {
            id: "demo-faculty-1",
            name: "Demo Faculty",
            email: "faculty.demo@choate.edu",
            role: "faculty",
          };
    localStorage.setItem(LS_DEMO_USER, JSON.stringify(user));
    return user;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(LS_DEMO_USER);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(LS_DEMO_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

let activeProvider: AuthProvider = new DemoAuthProvider();

/** Swap the auth implementation (school IT: call once at app startup). */
export function setAuthProvider(provider: AuthProvider): void {
  activeProvider = provider;
}

/** The currently active auth provider (DemoAuthProvider until replaced). */
export function getAuthProvider(): AuthProvider {
  return activeProvider;
}
