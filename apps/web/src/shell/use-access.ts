import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveAccess } from '../lib/access';
import type { Access } from '../lib/access';
import { browserSupabase } from '../lib/supabase';

export type AccessState = Access | { readonly status: 'loading' };

/** The current access, kept up to date when the user signs in or out (ADR-0008). */
export function useAccess(): { access: AccessState; refresh: () => void } {
  const [access, setAccess] = useState<AccessState>({ status: 'loading' });
  // Only the latest check may set the state; an older, slower answer is dropped.
  const latest = useRef(0);

  const check = useCallback(() => {
    const id = ++latest.current;
    void resolveAccess(browserSupabase()).then((next) => {
      if (id === latest.current) setAccess(next);
    });
  }, []);

  const refresh = useCallback(() => {
    setAccess({ status: 'loading' });
    check();
  }, [check]);

  useEffect(() => {
    const client = browserSupabase();
    if (client === null) {
      check();
      return () => {
        latest.current += 1;
      };
    }
    // Supabase reports the stored session on load (as both INITIAL_SESSION and
    // SIGNED_IN), so a check runs only when the signed-in user actually changes.
    let user: string | null | undefined;
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
      const next = session?.user.id ?? null;
      if (next === user) return;
      user = next;
      // Supabase calls this while it holds its session lock; read the session afterwards.
      setTimeout(check, 0);
    });
    return () => {
      latest.current += 1;
      data.subscription.unsubscribe();
    };
  }, [check]);

  return { access, refresh };
}
