# Backend integration notes (for Prince)

Front end: React + Vite SPA. It talks to Supabase with the publishable key only. The service key lives only inside the `sign-in` Edge Function.

Nothing in this folder has been applied to the live project. Please review first.

## 0. Run order (all pieces)
SQL Editor, in this order, each file once (all are safe to run twice):
1. `20261022_0001_frontend_integration.sql` (if not already run)
2. `20261022_0002_registration.sql`
3. `20261022_0003_approvals_members.sql`
4. `20261022_0004_sessions_attendance.sql`
5. `20261022_0005_executives_roles_programs.sql`
6. `20261022_0006_analytics_audit_settings.sql`
7. `20261022_0007_public_executives.sql`
8. `20261022_0008_edit_executive_since.sql`
9. `20261022_0009_member_since.sql`
10. `20261022_0010_executive_pictures.sql` (also re-run 0005 once)
11. `20261022_0011_picture_upload_fix.sql` (fixes picture uploads; run once)
12. `20261022_0012_reviewer_read_only.sql` (Reviewer read-only access; run once)
13. `20261022_0013_roles_for_everyone.sql` (roles for any member, Registrar privileges on top; run once, and do not run 0005 again after it)
14. `20261022_0014_account_deletion.sql` (members can ask to be deleted, Super Admin approves or deletes a Deactivated account; erases the person and keeps the records. Also deploy the Edge Function `admin-delete-account`, and redeploy `send-queued-emails`)
15. `20261022_0015_protect_super_admin.sql` (only a Super Admin can suspend, deactivate, edit or change the student number of a Super Admin)

Edge Functions (CLI, `--no-verify-jwt --use-api`): `forgot-password`, `admin-create-user`, `admin-reset-password`, `send-queued-emails`, `admin-delete-account`, and redeploy `sign-in`.

Queued emails: actions write rows to `email_queue`; `send-queued-emails` sends them over SMTP and the app calls it right after the action. It needs the secrets `SMTP_USER` and `SMTP_PASS` (Edge Functions, Secrets). The SMTP settings under Authentication only cover sign-up and reset emails, so they do not give this function its login. Until the secrets exist the function answers 503 and rows stay queued.

Pages: https://crispinit187.github.io/ICTAZ-CBU-LSKC-MS/ (merge `dev` into `main` to update it).

## 1. Apply the migration to a branch first
`supabase/migrations/20261022_0001_frontend_integration.sql`

It adds: the `handle_new_user` trigger (email sign-ups become a Pending member with the Member role; Google sign-ins create nothing), the email-confirmed sync, the password-change trigger that clears `must_change_password`, read policies for `members`, `terms_versions`, `terms_acceptances`, `settings`, `email_templates`, `my_context()`, `accept_terms(uuid[])`, v1 sample Terms/Privacy/staff text, and `search_path` fixes for the 10 flagged functions.

It was checked only on a local Postgres stub. My attempt to run it on the live project was cancelled. Triggers on the real schema (for example `enforce_role_requires_exec`, `protect_last_super_admin`) may react to the Member `user_roles` insert. Please test on a branch.

## 2. Deploy the Edge Function
`supabase/functions/sign-in/index.ts` accepts an 8-digit student number, an email, or `admin`, rate-limits with `rate_limit_counters` (5 failures, 10 min window, 30 s delay; TODO read these from `settings`), and returns the same 401 for unknown account and wrong password. Until it is deployed the front end signs in by email directly and shows "student number not switched on yet" for student numbers.

## 3. Supabase settings
- Auth > Providers: enable Google. Add the site URL and `https://crispinit187.github.io/ICTAZ-CBU-LSKC-MS/login` to redirect URLs.
- Auth > Email: enable "Confirm email" (SRS AU-02).
- Auth > Passwords: enable leaked password protection (advisor warning).
- Create the bootstrap Super Admin: a `members` row with `is_bootstrap = true`, `must_change_password = true`, status Active, and the Super Admin role. Do not put the initial password in any document.

## 4. Contract the front end relies on
`rpc('my_context')` returns `{id, name, student_number, email, status, status_reason, must_change_password, is_bootstrap, email_verified, roles[], permissions[], pending_docs[{id,doc_type,version}]}`.
Routes are guarded by permission code: `analytics.view` /admin, `attendance.mark_manual` /registrar, `role.assign` /roles, `session.qr_display` /display, `attendance.scan` /scan and /profile. The database policies are the real enforcement; the front end only hides screens.

## 5. Things to know
- Administrator password reset must set `must_change_password = true` AFTER changing the password, because the trigger clears the flag whenever the password hash changes.
- Possible bug: policy `exec_self_update` has a WITH CHECK subquery comparing `executive_profiles_1.id = executive_profiles_1.id`, so it matches every row and will error once there is more than one profile.
- `has_permission`, `is_active`, `ok_to_act` are executable by `anon`. Left alone because some policies are `TO public`. Scope those policies to `authenticated`, then revoke.
- Registration still needs the programme text mapped to `program_id` (the trigger stores `program_raw`).
- Every screen now uses the database when it is configured; the sample data shows only in the design demo.

## 6. Front-end setup
```
git switch dev
npm install
copy .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

The deployed site is https://crispinit187.github.io/ICTAZ-CBU-LSKC-MS/ (GitHub Actions, `.github/workflows/pages.yml`).
`VITE_DEMO_OPEN=true` in `.env.local` opens every screen without an account (local use only).
