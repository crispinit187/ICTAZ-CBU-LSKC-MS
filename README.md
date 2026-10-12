# ICTAZ CBU LSKC Management System

A web platform for the ICTAZ chapter at Copperbelt University, Lusaka Campus. It is built to grow into the chapter's main management system, module by module. **Attendance** is the first module.

> **Status:** Requirements and planning. See the System Requirements Specification (v2.2) in `docs/`. Development has not started.

## What it does

Members register, are approved by an Administrator, and sign in with their student number, email or Google. Each attendance session has its own QR code, shown at the venue and rotating automatically. A member presses **Scan**, scans the code, and is marked present. Members have no dashboards.

Staff work through five roles:

| Role | Purpose |
|---|---|
| **Member** | Register, sign in, scan to mark attendance, manage own details. |
| **Registrar** | Mark, unmark and excuse members manually by searching for their name. |
| **Reviewer** | Read-only access to attendance lists, analytics and executive details. |
| **Administrator** | Run sessions, accounts, executive records, analytics and exports. |
| **Super Admin** | Everything an Administrator can do, plus assigning roles, system settings, email templates, Terms and anonymisation. |

Registrar, Reviewer and Administrator roles are given only to current executive members and end automatically when the executive profile ends.

## Features (Release 1)

- Self-registration with email confirmation and Administrator approval; Administrator-created accounts
- Sign in with student number or email and password, or with Google
- Password change, forgotten-password reset and Administrator-initiated reset
- Bootstrap Super Admin that retires once another Super Admin is active
- Rate limiting per user, student number and email
- Member records with program (automatically matched and grouped) and year of study with semesters
- Executive positions and versioned profiles, with consent-based public display
- Sessions with facilitators (members, executives or guests)
- Per-session rotating signed QR code (45 seconds by default, adjustable from 30 to 60) with cross-fade display and countdown
- Manual marking, unmarking and excused absences
- Analytics, reports and exports (Administrator exports; Reviewer read-only)
- Audit log of sign-ins, account changes and attendance changes
- Live updates on staff screens, the QR display and member status screens
- Terms of Use and Privacy Notice acceptance, editable email templates, and data retention rules

## Tech stack

- **Front end:** React single-page application
- **Back end:** Supabase only: PostgreSQL with row-level security, Auth (password and Google), Storage, Realtime and Edge Functions
- **Hosting:** Supabase free plan to start; static hosting for the React build

There is no separate application server. Security is enforced in the database through row-level policies and in server functions, never only in the interface.

## Project structure (planned)

```
/docs                    Requirements specification and design notes
/supabase
  /migrations            Versioned database migrations
  /functions             Edge Functions (scan, QR token, emails, jobs)
  seed.sql               Fake development data
/src
  /core                  Auth, roles, app shell, shared components
  /features
    /attendance          Sessions, QR display, scan, marking, excuses
    /members             Member records, programs, semesters
    /executives          Positions, profiles, public page
    /analytics           Dashboards, reports, exports, audit viewer
```

## Getting started

Setup steps will be added once development starts. In outline:

1. Clone the repository and install dependencies.
2. Copy `.env.example` to `.env` and add the development project URL and public (anon) key supplied by the database owner.
3. Start the app and sign in with a test account for the role you are working on.

Never commit the Supabase service key or the database password. The front end only ever uses the project URL and the public key.

## Working agreements

- **Database changes** are made only through versioned migration pull requests. Nobody edits tables by hand in the Supabase dashboard.
- **Environments:** separate development and live Supabase projects. Real member data never goes into development.
- **Security tests:** each feature owner writes permission tests for their own feature, including direct calls to the database API, and the database owner reviews the row-level policies.
- **Branches:** one branch per feature, merged by pull request after review.
- **Naming:** database objects are named by module (for example `attendance_sessions`), so later modules do not clash.

## Roadmap

1. Core platform: accounts, statuses, sign-in, roles, audit log
2. Members and executives
3. Attendance module
4. Analytics, reports, emails and retention jobs
5. Testing, pilot and production
6. Later modules (for example projects, challenges and submissions), each specified separately

## Team

- Prince: Supabase and database
- Crispin: platform front end and integration
- Temwa: attendance module
- Katonga: members and executives
- To be assigned: analytics, emails and quality

## Licence

To be decided by chapter leadership.
