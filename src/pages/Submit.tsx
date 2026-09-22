/**
 * Submit — `/submit` (design/submit.md). The app's only gated surface:
 * guarded on the swappable AuthProvider from src/lib/auth.ts
 * (DemoAuthProvider today, Microsoft Entra ID when school IT swaps it in).
 * Unauthenticated → DemoAuthProvider placeholder screen; authenticated →
 * the submission form. Reading everywhere else never requires sign-in.
 */
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { getAuthProvider, type User, type UserRole } from "@/lib/auth";
import AuthStub from "@/components/submit/AuthStub";
import SubmissionForm from "@/components/submit/SubmissionForm";

export default function Submit() {
  const [user, setUser] = useState<User | null>(() => getAuthProvider().getUser());
  const [signingIn, setSigningIn] = useState<UserRole | null>(null);

  const signIn = useCallback(async (role: UserRole) => {
    setSigningIn(role);
    try {
      setUser(await getAuthProvider().signIn(role));
    } finally {
      setSigningIn(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    await getAuthProvider().signOut();
    setUser(null);
  }, []);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0D2440",
            color: "#F7F3EA",
            border: "1px solid #13315C",
          },
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {user ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SubmissionForm user={user} onSignOut={signOut} />
          </motion.div>
        ) : (
          <motion.div
            key="stub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AuthStub signingIn={signingIn} onSignIn={signIn} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
