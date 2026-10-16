import { useState } from 'react';
import type { ReactNode } from 'react';

import { returnAddress, signInWithGoogle, signOut } from '../lib/access';
import { browserSupabase } from '../lib/supabase';
import type { AccessState } from './use-access';

function signOutHere(): void {
  const client = browserSupabase();
  if (client) void signOut(client);
}

/** The signed-in account in the header, with the sign-out button. */
export function AccountMenu({ email }: { email: string }) {
  return (
    <div className="account">
      <span className="account__email" data-testid="account-email">
        {email}
      </span>
      <button type="button" onClick={signOutHere}>
        Çıkış yap
      </button>
    </div>
  );
}

function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const start = () => {
    const client = browserSupabase();
    if (!client) return;
    setError(null);
    void signInWithGoogle(client, returnAddress(window.location)).then((result) => {
      if ('error' in result) setError(result.error);
    });
  };
  return (
    <>
      <h1 className="page__title">Giriş yap</h1>
      <p className="page__lead">
        FC 27 UT Manager yalnızca davetli hesaplara açık. Devam etmek için Google hesabınla giriş
        yap.
      </p>
      <button type="button" className="button--primary" onClick={start}>
        Google ile giriş yap
      </button>
      {error && (
        <p className="gate__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

/** Shows `children` only to an allow-listed account; everyone else gets a gate screen. */
export function AccessGate({
  access,
  refresh,
  children,
}: {
  access: AccessState;
  refresh: () => void;
  children: ReactNode;
}) {
  if (access.status === 'allowed') return children;
  return <div className="page gate">{gateContent(access, refresh)}</div>;
}

function gateContent(access: Exclude<AccessState, { status: 'allowed' }>, refresh: () => void) {
  switch (access.status) {
    case 'loading':
      return <p role="status">Oturum kontrol ediliyor…</p>;
    case 'signed-out':
      return <SignIn />;
    case 'denied':
      return (
        <>
          <h1 className="page__title">Erişim yok</h1>
          <p className="page__lead">
            {access.email} hesabının bu uygulamaya erişimi yok. Başka bir Google hesabıyla girmek
            için önce çıkış yap.
          </p>
          <button type="button" onClick={signOutHere}>
            Çıkış yap
          </button>
        </>
      );
    case 'error':
      return (
        <>
          <h1 className="page__title">Erişim kontrol edilemedi</h1>
          <p className="gate__error" role="alert">
            {access.message}
          </p>
          <button type="button" onClick={refresh}>
            Tekrar dene
          </button>
        </>
      );
    case 'unconfigured':
      return (
        <>
          <h1 className="page__title">Giriş yapılandırılmamış</h1>
          <p className="page__lead">
            Bu dağıtımda Supabase ayarları eksik, bu yüzden giriş yapılamıyor.
          </p>
        </>
      );
  }
}
