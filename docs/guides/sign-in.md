# Sign-in setup guide

Only two Google accounts may use the app ([ADR-0008](../adr/0008-sign-in-and-access.md)). This guide sets that up once. It takes about 20 minutes and needs:

- the Google account that will own the sign-in setup (any Gmail account works),
- the Supabase project from the [deployment guide](deployment.md),
- the two Gmail addresses that may use the app.

Do the parts in order. Each part says what to copy and where to paste it.

## A. Find your Supabase callback URL

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and click the `fifa27-ut-manager` project.
2. In the left sidebar, click **Authentication**.
3. Under **Configuration**, click **Sign In / Providers**.
4. Scroll to **Auth Providers** and click **Google**. A panel opens on the right.
5. Find the field **Callback URL (for OAuth)**. It looks like `https://abcdefghijklmnop.supabase.co/auth/v1/callback`. Click the copy icon next to it and keep it at hand; you paste it in part B.
6. Leave the panel open in this tab. You come back to it in part C.

## B. Create the Google sign-in client

Open a new browser tab for this part.

**B1. Create a Google Cloud project**

1. Open [console.cloud.google.com](https://console.cloud.google.com) and sign in with your Google account. Accept the terms if Google asks.
2. Click the project picker at the top left, next to the **Google Cloud** logo. It reads **Select a project** or shows a project name.
3. In the dialog, click **New project** at the top right.
4. **Project name:** `fc27-ut-manager`. Leave **Location** as it is. Click **Create**.
5. Wait for the notification, then click **Select project** in it. The project picker now shows `fc27-ut-manager`.

**B2. Describe the app (Branding)**

1. In the search bar at the top, type `Google Auth Platform` and open it.
2. If you see **Google Auth Platform not configured yet**, click **Get started**. A four-step form opens:
   - **App Information:** **App name** `FC 27 UT Manager`. **User support email**: choose your address. Click **Next**.
   - **Audience:** choose **External**. Click **Next**.
   - **Contact Information:** type your address under **Email addresses**. Click **Next**.
   - **Finish:** tick **I agree to the Google API Services: User Data Policy**. Click **Continue**, then **Create**.

**B3. Allow only the two accounts (Audience)**

1. In the left menu of Google Auth Platform, click **Audience**.
2. Check that **Publishing status** says **Testing**. Do **not** click **Publish app**. In Testing, Google lets only the test users below sign in.
3. Under **Test users**, click **+ Add users**.
4. Type the two Gmail addresses that may use the app, one per line. Click **Save**.

**B4. Create the client (Clients)**

1. In the left menu, click **Clients**, then **+ Create client** at the top.
2. **Application type:** choose **Web application**.
3. **Name:** `Supabase`.
4. Under **Authorized JavaScript origins**, click **+ Add URI** and enter `https://fifa27-ut-manager.vercel.app`.
5. Under **Authorized redirect URIs**, click **+ Add URI** and paste the callback URL from part A (`https://<project-ref>.supabase.co/auth/v1/callback`). It must match exactly, with `https` and no slash at the end.
6. Click **Create**.
7. A dialog **OAuth client created** shows two values. Google shows the secret only now, so copy both before closing:
   - **Client ID:** ends in `.apps.googleusercontent.com`.
   - **Client secret:** starts with `GOCSPX-`.
   - You can also click **Download JSON** to keep a copy in your password manager. Never put either value in the repository, in a chat or in an issue.

## C. Turn on Google in Supabase

Go back to the Supabase tab from part A, with the **Google** panel still open.

1. Switch on **Enable Sign in with Google**.
2. **Client IDs:** paste the **Client ID** from B4.
3. **Client Secret (for OAuth):** paste the **Client secret** from B4.
4. Leave the other switches as they are and click **Save**.

**Turn off e-mail sign-in.** Google is the only way in.

1. On the same **Sign In / Providers** page, under **Auth Providers**, click **Email**.
2. Switch off **Enable Email provider** and click **Save**.
3. Higher up on the page, leave **Allow new users to sign up** switched **on**. Google sign-in needs it to create each account the first time.

**Tell Supabase where the app lives.**

1. In the left sidebar under **Authentication → Configuration**, click **URL Configuration**.
2. **Site URL:** enter `https://fifa27-ut-manager.vercel.app` and click **Save changes**.
3. Under **Redirect URLs**, click **Add URL** and enter `https://fifa27-ut-manager.vercel.app/**`. Click **Save URLs**.
4. Click **Add URL** again and enter `https://fifa27-ut-manager-*.vercel.app/**`. Click **Save URLs**. This covers the preview deployments of pull requests.

## D. Create the allow-list table

The table comes from the migration in this pull request. Run it before you add the addresses.

1. Open the repository on GitHub and click **Actions**.
2. In the left list, click **Database migrations**.
3. Click **Run workflow** on the right. In **Use workflow from**, choose the branch **feat/google-sign-in**. Click the green **Run workflow** button.
4. Wait until the run shows a green tick (about a minute).

From this moment the old production site shows an empty catalog, because only allow-listed accounts may read it and the old site cannot sign in. That ends when you merge the pull request, so do parts E and F right away.

## E. Add the two addresses

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **+ New query** (or the **+** tab).
3. Paste the following, replacing the two example addresses with the real ones. Keep them in lower case and inside the single quotes:

   ```sql
   insert into public.allowed_users (email)
   values ('first.person@gmail.com'), ('second.person@gmail.com');
   ```

4. Click **Run**. The result reads **Success. No rows returned**.
5. To change the list later, run `delete from public.allowed_users where email = 'old@gmail.com';` and insert the new address the same way. Remember to change the test users in B3 as well.

## F. Check it

1. Open the pull request's preview deployment from Vercel's comment on the pull request.
2. The page shows **Giriş yap** and a **Google ile giriş yap** button, and no menu.
3. Click the button and choose one of the two accounts. Google may warn **Google hasn't verified this app**: click **Continue**. This is expected for an app in Testing.
4. You return to the same page, now with the menu. On a wide screen the header shows your address next to **Çıkış yap**.
5. Open **Katalog**. The cards load.
6. Click **Çıkış yap**. The page shows **Giriş yap** again.
7. Try a third Google account. Google refuses it with **Access blocked** (from B3). Even if it got through, the app would show **Erişim yok**.

If the button leads to a Google error page:

- **Error 400: redirect_uri_mismatch:** the redirect URI in B4 differs from the callback URL in part A. Copy it again from Supabase and replace it in Google.
- **Access blocked: … has not completed the Google verification process:** the account is not a test user in B3.

If you return to the app and see **Erişim kontrol edilemedi**, the migration in part D has not run yet.
