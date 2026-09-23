# Admin user creation

Administrators (active public.users records with role `leader`) can open **User Management → Add User**, enter an email and password, and create a staff account. New accounts use role `worker` and can sign in immediately without email confirmation. The administrator stays signed in. Existing role management remains available on the page.

## One-time Supabase setup

1. Link the Supabase CLI to the same project used by `VITE_SUPABASE_URL`: `supabase link --project-ref YOUR_PROJECT_REF`.
2. Apply the migration: `supabase db push`. It requires the existing `public.users` table with `id`, `email`, `short_code`, `role`, `employee_id`, and `is_active` columns. Review existing migrations and policies before applying to a live project. The new restrictive policies prevent non-admin users from inserting, updating, or deleting user profiles, including promoting themselves. Existing read policies are preserved. Existing permissive policies still determine which admin writes are allowed.
3. Deploy: `supabase functions deploy create-user`. The function uses Supabase-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets; never put the service role key in a frontend environment variable. Gateway JWT verification is disabled in config because the function validates the bearer token using `auth.getUser` and checks the caller's active administrator record before creating any account.
4. In Supabase Authentication settings, disable **Allow new users to sign up** so public signup cannot bypass administrator provisioning. Admin API account creation continues to work.
5. Ensure at least one existing auth account has a matching active `public.users` row with role `leader`. This initial administrator must be provisioned by a trusted project operator in Supabase; the app cannot bootstrap administrator privileges.

## Verification

- Sign in as an administrator, open Add User, and create an account using a new email and a password that meets the project's password policy.
- Confirm the administrator remains signed in, the new user appears in the list, and the new credentials work in a separate browser session without email confirmation.
- Confirm duplicate emails and invalid passwords display errors in the dialog.
- Sign in as staff and visit `/UserManagement` directly: access must be denied. Requests to `create-user` using staff tokens must return 403; missing/invalid tokens must return 401.
- Confirm staff cannot update their own role through the database API.

Live account creation requires deploying the function and migration to your Supabase project. If saving the profile fails, the function removes the newly created auth account; cleanup failures explicitly instruct the administrator to resolve the incomplete account in Supabase.