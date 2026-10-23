# NRC Educational Consultants — Website Rebuild Plan

Domain: `nrcedu-uk.com` · Started: 2026-10-13 · Target delivery: ~2026-12-03 (7 weeks)

## 1. Decisions made

| Topic | Decision |
|---|---|
| Approach | Full rebuild from scratch (old site is reference only) |
| Scope | Full-stack: public website + admin panel + CRM dashboard |
| Content updates | Client edits content through the admin panel |
| Hosting | Vercel (web app) + Railway (database / backend services) |
| Branding | Logo exists; colours chosen by developer; glassmorphism carried through the whole site |
| Content | Client sends university/partner list later; build with placeholders |
| Deadline | One month and 20 days; nothing deferred to after launch |

| Roles | Admin, staff/counsellor, agent and student all log in |
| CRM access | Both sides use it: staff manage, students track applications and upload documents |
| Old data | Nothing to migrate |
| DNS | Controlled by developer |
| Framework | Next.js (React), developer knows MERN and Next.js |

| Database | PostgreSQL + Prisma |
| Backend | No separate server; API runs inside the Next.js app on Vercel |
| Old site failure | Data stopped loading because the Railway server was unpaid and shut down |

| Database host | Railway (PostgreSQL only, no app server) |
| Accounts and billing | Client owns and pays for Vercel and Railway |

| Business model | NRC is itself an official agent for some universities, and has its own sub-agents in different countries who bring students to NRC |

| Commission | Track both: what each university pays NRC, and what NRC pays its sub-agents |
| Lead routing | Auto-assign by country, with the admin able to reassign by hand |

## 2. Open questions

- [ ] Review the design system at `/styleguide`: glassmorphism throughout; deep blue primary (#1B5E9E), dark teal-navy (#0F4C63), amber accent (#F59E0B), light blue-grey surface; Plus Jakarta Sans headings, Inter body; light theme only
- [ ] Higher-quality logo (SVG) if the client has one; current file is a 559×447 PNG taken from the live site (`public/nrc-logo.png`)

- [ ] Office address, social links, final legal brand name
- [ ] Keep all 10 test-prep pages, or fewer?
- [ ] Email: the client has 5 mailboxes on the domain; decide which one receives which notifications (see 4.7), and which one is the public contact address

## 3. Proposed stack (to confirm)

- Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- PostgreSQL on Railway, Prisma ORM
- Public pages statically generated and revalidated, so they stay up even if the database is down
- Better Auth with role-based access (chosen over Auth.js, whose current major version is still a beta)
- One codebase: public site, admin panel and CRM in the same app
- File storage for images and student documents (S3-compatible, e.g. Cloudflare R2)
- Transactional email (e.g. Resend) for form and status notifications

## 4. Site map

**Public**
- Home
- About Us
- Services
- Universities (list, detail) · Courses (detail) · Subjects (list, detail) · Study destinations
- Apply button on every university and course page, leading into the application form
- Test Prep (one template, many tests)
- Blogs (list, post)
- Affiliated universities / partners
- Contact
- Free consultation / Start Your Journey (lead form)
- Become an Agent (application form)
- Login / Register

**Admin panel (content)**
- Universities, subjects, countries, test-prep pages
- Blog posts, testimonials, partners, FAQs, intakes
- Site settings (contact details, social links, menus)

**CRM dashboard**
- Leads (from consultation and contact forms): status, assignment, notes
- Students: profile, documents, application pipeline per university
- Agents: applications, approval, their referred students
- Users and roles
- Overview: counts, pipeline, recent activity

## 5. Features per role (draft, to confirm)

Everything below is in scope for launch.

**Visitor (not logged in)**
- Browse all public pages
- Submit consultation, contact and Become an Agent forms
- Register as a student

**Student**
- Profile: personal details, education history, test scores
- Upload documents (passport, transcripts, certificates, SOP)
- Start an application for a specific course and intake, either from the dashboard or from the Apply button on a public university or course page (login or register first, then the form opens with that course preselected)
- Track each application's status and see what is required next
- Email on status change
- Message their counsellor
**Agent**
- Apply through the public form; account is active after admin approval
- Add and manage their own referred students
- Submit applications and upload documents on a student's behalf
- Track status of their students' applications
- Commission tracking
**Staff / counsellor**
- Leads inbox: view, assign, change status, add notes, convert a lead to a student
- Students: view and edit profiles, review documents (approve or request again)
- Applications: move through pipeline stages, add notes
- Sees all records by default; admin can restrict each staff member's access per module
- Follow-up reminders
**Admin**
- Everything staff can do, across all records
- Manage users and roles; set per-staff permissions; approve or reject agents
- Manage all website content (section 4, admin panel)
- Site settings
- Dashboard: lead, student and application counts, pipeline, recent activity
- Export to CSV- Activity log
**Application pipeline stages (draft)**
New → Documents pending → Submitted to university → Offer received → Deposit / CAS → Visa applied → Visa granted or refused → Enrolled

## 6. Database schema (draft)

**Accounts**
- `User`: name, email, password hash, role (ADMIN, STAFF, AGENT, STUDENT), status (active, pending, suspended)
- `StaffPermission`: user, module (leads, students, applications, agents, content, users, settings), can view / can edit
- `AgentProfile` (NRC's sub-agents): user, company, country of operation, phone, approval status

**Students**
- `StudentProfile`: user, date of birth, nationality, passport no., address, assigned counsellor, referring agent (optional)
- `EducationRecord`: student, level, institution, result, year
- `TestScore`: student, test (IELTS, PTE, ...), score, date
- `Document`: student, application (optional), type, file URL, review status, reviewer note

**CRM**
- `Lead`: name, email, phone, interest (country, level), source form, status, assigned staff, converted student (optional)
- `Application`: student, course, intake, stage, assigned staff, submitting agent (optional)
- `ApplicationStageHistory`: application, stage, changed by, date
- `Note`: author, text, attached to a lead, student or application
- `Message`: sender, recipient, student thread, text, read at
- `Reminder`: staff, due date, text, linked lead or student, done
- `Commission`: application, direction (university pays NRC, or NRC pays sub-agent), agent (for sub-agent payouts), amount (from the university's rate, editable by admin), status (pending, received or paid)
- `CountryAssignment`: country, default staff or sub-agent for new leads from that country
- `ActivityLog`: user, action, record type and id, date

**Website content**
- `Country`, `University` (country, logo, description, ranking, NRC is official representative, commission rate paid to NRC, commission rate paid to sub-agents), `Subject`
- `Course`: university, subject, level, duration, tuition fee
- `Intake`: course or university, start date, application deadline
- `TestPrepPage`, `BlogPost`, `Testimonial`, `Partner`, `FAQ`
- `SiteSetting`: contact details, social links, menus

## 7. Tasks (one at a time)

### Phase 0 — Planning (week 1)
- [x] 0.1 Answer open questions
- [x] 0.2 Confirm stack
- [x] 0.3 Final feature list per role
- [x] 0.4 Database schema draft

### Phase 1 — Foundation (week 1)
- [x] 1.1 Create project, git repo, linting (Next.js 16.4, TypeScript, Tailwind, ESLint, `src/app`; route folders are added with each feature)
- [ ] 1.2 Design system: colours, fonts, core components (built; awaiting visual review at `/styleguide`)
- [ ] 1.3 Database on Railway, Prisma schema, seed data
  - [x] Prisma 7.10 installed (pinned; npm's "latest" is an 8.0 release candidate), schema written and validated (`prisma/schema.prisma`)
  - [x] Railway database connected; first migration `init` applied (all tables created)
  - [x] Seed script (`npm run db:seed`): 5 destination countries added
  - [ ] First admin account: fill `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`, then run `npm run db:seed`
- [x] 1.4 Auth and roles (Better Auth 1.7: email and password, Google ready; no separate login pages: sign in / sign up / Google live in a panel that slides in from the right (`AuthDrawer`, built on the reusable `Drawer` in `src/components/ui/drawer.tsx`); protected `/dashboard`; role and per-staff permission checks in `src/lib/session.ts`)
  - [x] Google sign-in: add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
  - [x] Password reset (4.7)
  - [x] Email verification: registering sends a confirmation link (Better Auth, via the email queue). Password sign-in is refused until the address is confirmed, for every role (staff and agents too); each refused sign-in emails a fresh link, and the link signs the person in. Sessions from before the rule see only the Account page with "Send again" until they confirm. Google sign-ins and invite-link users already count as confirmed. Not enforced while email is switched off
    - [ ] Register a new student: the email arrives, the bar shows; open the link: lands on the dashboard signed in, bar gone
    - [ ] Press "Send again": "A new link is on its way" and a second email arrives
  - [x] Fuller sign-up: optional phone (copied to the student record), confirm password, Show/Hide, strength meter, agree to `/terms` and `/privacy` (placeholder wording; the client's own text needed)
  - [x] Account and security page (`/dashboard/account`, every role): name and phone, change email (old address approves, new one confirms), change password (signs out other devices; Google-only accounts get an "add a password" email), signed-in devices with sign out one / all others, students can close their own account (refused while they have applications; their document files are deleted)
  - [x] Two-step sign-in (Better Auth `twoFactor` plugin): authenticator app with QR code, 10 one-time backup codes, "trust this device for 30 days"; code step in the sign-in panel. Required for admins and staff who sign in with a password: the dashboard shows only the Account page until it is on. Google sign-ins skip it
    - Checked against a local production build: sign-up with phone, enabling, password-only sign-in held for a code, wrong and reused codes refused, backup code sign-in, device list and sign-out of others, password change, account deletion
    - [ ] Sign in as admin: the dashboard asks for two-step set-up; scan the QR code, enter the code, save the backup codes; sign out and back in with a code
- [ ] 1.5 Vercel preview deployment (skipped for now; needs the client's Vercel account)

### Phase 2 — Public website (week 2)
- [x] 2.1 Layout: header, footer, navigation (`src/components/site`)
- [x] 2.2 Home (sample data; vibrant glass style approved)
  - [x] Hero slider managed at `/dashboard/slides` (add, edit, hide, reorder, delete); image by address until uploads exist (3.4)
  - [x] Sections: key numbers, destinations, featured universities, services, how it works, testimonials, partners, latest posts, FAQs
  - [x] Sample content: `npm run db:seed:demo`; remove before launch with `npm run db:seed:demo -- --remove`
- [x] 2.3 About, Services, Contact (placeholder wording). Contact form saves a lead; staff email alert comes with 4.7; office address and opening hours still needed from the client
- [x] 2.3b Our offices: `Office` table, shown on the home and contact pages (3 sample offices; real addresses needed from the client)
- [x] 2.4 Universities, subjects, destinations: `/universities` with search and filters, university and course pages with Apply buttons, `/destinations`, `/subjects`. Apply buttons lead to `/dashboard/apply?course=…`, which is built in 4.2
- [x] 2.5 Test prep: `/test-prep` and a page per test (guide text is written in the admin panel later)
- [x] 2.6 Blog: `/blog` with paging and article pages (plain text until the editor in 3.3)
- [x] 2.7 Forms: `/consultation` (saves a lead with country, destination and level; auto-assigns when a country has a default owner), `/become-an-agent` (creates a locked agent account awaiting admin approval), plus `/partners`. World country list (197) seeded for the dropdowns
  - [x] Agent approval screen (3.0)
  - [x] Emails to staff and applicants (4.7)

### Phase 3 — Admin panel (week 3)
- [x] 3.0 Users, roles and per-staff permissions (`/dashboard/users`): search and filter all accounts, admins add staff/admins, change role and status (suspending signs the person out; the last active admin cannot be demoted; at most 2 administrators, suspended ones included), per-module access for staff (view and edit / view only / none), approve or reject agent applications; every change is written to the activity log
  - Test checklist (needs the first admin from 1.3):
    - [ ] Sign in as admin, open Dashboard → Users; search and role/status filters narrow the list
    - [ ] Add a staff member; sign in as them in a private window and reach `/dashboard`
    - [ ] Set their Website content to "No access": the slider link disappears and `/dashboard/slides` sends them back
    - [ ] Set their Users module to "View only": they see the list but no edit forms
    - [ ] Submit `/become-an-agent`, check sign-in is refused, approve it, check sign-in works; reject another and check it stays locked
    - [ ] Suspend a signed-in user: their next page load signs them out
    - [ ] Try to demote yourself or the only admin: an error is shown and nothing changes
- [x] 3.1 Dashboard layout and navigation: dark glass sidebar (slides in on mobile), top bar with role, "View website" and Sign out; menu built per role and per-staff permissions in `src/lib/dashboard-nav.ts`, with planned screens shown greyed as "Soon"; overview page with counts (new leads, agents waiting, students, live slides)
  - Test checklist:
    - [ ] Admin sees all groups (Overview, CRM, Website, Admin); the current page is highlighted
    - [ ] Staff with Website content set to "No access" loses the Website group
    - [ ] Student and agent see only their own items, and the overview shows their "coming soon" card
    - [ ] On a phone-width window the menu button opens the sidebar; tapping outside, Escape or a link closes it
    - [ ] Overview counts link to the matching filtered user list and the slider
- [x] 3.2 CRUD for universities, subjects, countries
  - `/dashboard/universities`: search, country filter, add/edit/delete; each university page also manages its courses and intakes (open/close, delete); commission rates are staff-only; a university or course with applications cannot be deleted (hide it instead)
  - `/dashboard/subjects`: add, edit, delete (courses keep existing without a subject)
  - `/dashboard/countries`: all 197 seeded; search, mark as study destination, description and images
  - `/dashboard/agents`: agent applications by status (waiting, approved, rejected) with approve, reject and revoke
  - Images are still by address (allowed hosts only) until uploads (3.4)
  - Test checklist:
    - [ ] Add a university, then a course and an intake; it shows on `/universities` and the course page has an Apply button
    - [ ] Untick "Show on the website": it disappears from the public list straight away
    - [ ] Leave the web address empty: one is made from the name; reusing an existing one shows an error
    - [ ] Mark a new country as destination: it appears on `/destinations`
    - [ ] Delete a subject: its courses remain, with no subject
    - [ ] Agents page: approve a waiting agent, it moves to Approved and can sign in; revoke it, sign-in is refused
- [x] 3.3 Blog editor, testimonials, partners, FAQs
  - `/dashboard/blog`: search and draft/published filter; editor with formatting toolbar (headings, bold, italic, links, lists, quotes) and a Preview tab; Publish / Save draft / Unpublish; publish date set the first time a post goes live
  - Articles are stored as Markdown and rendered safely (raw HTML ignored); old plain-text posts and test-prep text display as before. Images inside articles wait for uploads (3.4); the cover image works now
  - `/dashboard/testimonials`, `/dashboard/partners`, `/dashboard/faqs`: add, edit, show/hide, reorder, delete
  - Test checklist:
    - [ ] Write a post using every toolbar button, check Preview, Save draft: not on `/blog`; Publish: appears at the top of `/blog` and on the home page
    - [ ] Unpublish a post: it disappears from the website, its link shows "not found"
    - [ ] Add a testimonial, move it to the top: it is first on the home page; Hide removes it
    - [ ] Same for a partner logo and an FAQ
- [ ] 3.4 Image uploads (built; waiting for storage details)
  - Every image field in the dashboard has Upload / Replace / Remove with a preview; pasting an address still works
  - Upload route `POST /api/uploads/image` guards, in order: same-origin request; signed in and active; "Website content: edit" permission; rate limit (30 per 10 minutes, 300 per day, per person); 4 MB limit enforced while reading; file type decided by its bytes (JPG, PNG, WebP, GIF, AVIF; SVG refused); 40-megapixel cap against decompression bombs; at least 16 × 16 px
  - Every image is re-encoded to WebP (max 2400 px): removes camera/GPS metadata and anything hidden in the file; stored under a random name, never the uploaded one
  - Every upload is recorded in the new `Upload` table (who, when, size); migration `uploads` applied
  - Checked: real, oversized and EXIF images accepted and cleaned; renamed text, SVG with script, damaged PNG, 10,000 × 10,000 pixel bomb and tiny images refused; requests without or with a foreign Origin, and signed-out requests, refused
  - [x] To switch on (Cloudflare R2): create a bucket; turn on public access with a custom domain (e.g. `media.nrcedu-uk.com`) or the r2.dev address; create an API token with Object Read & Write for that bucket only; fill `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_URL` in `.env` (and later in Vercel); restart the app
  - Test checklist (after switching on):
    - [ ] Upload a phone photo as a slide background: it shows on the home page, right way up
    - [ ] Upload a PDF renamed to .jpg: refused with a clear message
    - [ ] Sign in as staff with Website content "View only": uploading is refused
- [x] 3.5 Site settings — Dashboard → Site settings (admin, or staff with Site settings "Can edit")
  - Contact details (phone, email, WhatsApp, address), social links, main menu and footer menu
  - Shown in the header, footer and contact page; missing or broken settings fall back to the built-in defaults
  - Links must start with `/` or `https://`, so `javascript:` and other unsafe links are refused; every save is written to the activity log
  - Test checklist:
    - [ ] Change the phone number: the footer and contact page show it straight away, and tapping it on a phone dials it
    - [ ] Add a WhatsApp number: the footer link opens a WhatsApp chat
    - [ ] Add a Facebook link: it shows in the footer; clear it and it disappears
    - [ ] Reorder the main menu lines and save: the header shows the new order
    - [ ] Type `Test | javascript:alert(1)` in the main menu: refused with the line number
    - [ ] Sign in as staff with Site settings "None": the menu item is hidden and /dashboard/settings sends you back
- [x] 3.6 Offices: add, edit, hide, reorder — Dashboard → Offices (Website content "Can edit")
  - Name, city, country, address, phone, email, opening hours, map link, photo
  - Only one head office: ticking it on one office clears it on the others; the head office always shows first
  - Test checklist:
    - [ ] Add an office: it shows on the home and contact pages
    - [ ] Mark a second office as head office: the first loses the badge, the new one moves to the front
    - [ ] Hide an office: it disappears from the website but stays in the dashboard
    - [ ] Move an office up or down: the website order changes
    - [ ] Enter a map link without https://: refused

### Phase 4 — CRM (weeks 4–6)
- [x] 4.1 Leads inbox and pipeline — Dashboard → Leads (staff with Leads "View only" can look, "Can edit" can change)
  - Inbox: Open / New / Contacted / Qualified / Converted / Lost / All tabs with counts; search name, email or phone; "Assigned to me" and "Not assigned" filters; 25 per page
  - Lead page: details and message; change status, counsellor and agent; add notes; one timeline of notes and every change (who and when)
  - Add a lead by hand (phone call, walk-in); source shows "Added by staff"
  - Lead routing (admin): default counsellor and/or agent per country; new leads from that country are assigned automatically
  - Delete (admin only) for spam and duplicates
  - Assignees are checked on the server: only active staff/admins and approved agents can be chosen
  - Convert to student comes with 4.2
  - Test checklist:
    - [ ] Submit the public consultation form: the lead appears under New with source "Consultation form"
    - [ ] Submit the contact form: it appears with source "Contact form"
    - [ ] Open a lead, set it to Contacted and assign yourself: the timeline shows both changes with your name
    - [ ] Add a note: it appears at the top of the timeline and the box clears
    - [ ] "Assigned to me" shows only your leads; "Not assigned" only unowned ones
    - [ ] Routing: give Bangladesh a counsellor, then submit the consultation form saying you live in Bangladesh — the new lead is already assigned
    - [ ] Add a lead by hand: you land on its page
    - [ ] Staff with Leads "View only": sees leads but no forms; with "None": the Leads menu item is gone
- [x] 4.2 Students and applications (staff side) — Dashboard → Students, Dashboard → Applications
  - Convert a lead: button on the lead page (needs Students "Can edit"); creates the student with the lead's name, email, phone, country, counsellor and agent, and marks the lead Converted. Same email twice links to the existing student
  - Add a student directly; edit profile (personal details, passport, address, counsellor, agent); notes
  - Start an application from the student page: course (grouped by university), then intake (only open intakes for that course or the whole university). Duplicate open applications for the same course and intake are refused
  - Applications: pipeline tabs by stage with counts (Open = not Enrolled / Visa refused / Withdrawn); search student, course or university; "Handled by me"
  - Application page: move stage with an optional note (full stage history with who and when), change who handles it, notes; admin delete for mistakes, refused when commission records exist
  - Students created by staff have no password yet: inviting them to the portal is part of 4.4 (also: a student registering on the website with an email staff already used must claim that record, not fail)
  - Education and test scores show on the student page; entering them comes with the student portal (4.4)
  - Test checklist:
    - [ ] Convert a lead: you land on the new student; the lead shows Converted and an "Open student record" button
    - [ ] Convert a lead whose email is a staff account: refused with a clear message
    - [ ] Add a student by hand, then edit their passport details and save
    - [ ] Start an application: pick a course, the intake list shows only that university's open intakes
    - [ ] Try the same course and intake again: refused
    - [ ] Move the application to "Offer received" with a note: history shows it with your name
    - [ ] Applications page: the Open tab count goes down when you set an application to Withdrawn
    - [ ] Staff with Applications "None": the Applications section is gone from the student page and menu
- [x] 4.3 Document uploads and review (built; switches on with storage, like 3.4)
  - Student page → Documents: upload (type, optional application), download, approve or "ask again" with a note, delete
  - Files live in a PRIVATE bucket (`STORAGE_PRIVATE_BUCKET`, no public access). Downloads go through `/api/documents/[id]`, which checks access every time and hands out a link valid for 60 seconds that always downloads (never opens inside the site)
  - Uploads go browser → storage directly (Vercel's 4.5 MB limit), up to 10 MB: the server signs a one-file upload link locked to the exact size, plus a tamper-proof ticket (HMAC with AUTH_SECRET) naming the student, type and storage key
  - After upload the server checks the file where it landed: exact size, real PDF / JPG / PNG by its bytes; images are re-encoded (removes location data and hidden content); anything failing is deleted
  - Same-origin check, sign-in, access check (staff: Students permission; students: own record; agents: their referred students), 30 uploads per 10 min / 200 per day counted at start, storage names chosen by the server
  - Verified: tampered, expired or someone else's tickets refused; HTML renamed to PDF refused; image metadata removed; routes refuse missing/foreign origin and signed-out users
  - Setup when storage arrives: create a second bucket with public access OFF, put its name in `STORAGE_PRIVATE_BUCKET`, give the API token access to it, and add a CORS rule: allowed origin = the site address, method PUT, header content-length
  - Test checklist (after switching on):
    - [ ] Upload a passport PDF on a student: shows "Waiting for review"; Download saves the file
    - [ ] Upload a phone photo: stored as JPG, downloads fine
    - [ ] Copy a Download link, sign out, open it: refused
    - [ ] "Ask again" without a note: refused; with a note: status "Asked again" and the note shows
    - [ ] Delete a document: gone from the list
- [x] 4.4 Student portal
  - Menu for students: Overview, My applications, My profile, Documents (Messages added in 4.8)
  - Overview: applications with stage, a to-do list (missing details, passport, education, test score, documents to redo), their counsellor
  - My profile: personal and passport details; education history and test scores (add / remove). Staff now edit education and scores on the student page with the same editor
  - Documents: upload (when storage is on), download, see "please upload again" notes, remove until approved; checklist of usually needed documents
  - My applications: progress bar, plain-language "what happens now" for each stage, history with the notes staff write on stage changes (staff notes stay internal; the stage-note box now says the student sees it)
  - Apply: every Apply button on the website opens /dashboard/apply with the course; the student picks an open intake. Only published courses; duplicates refused
  - Website sign-ups get their student record the first time they open the portal
  - Portal invites for students staff created: student page → "Make invite link" → copy and send. Link works once, expires in 7 days, a new link cancels the old; only a hash is stored. Opens /set-password, then sign in. (Sent by email automatically once 4.7 is done)
  - Signing up with an email NRC already used now explains to ask the counsellor for a link
  - Verified: invite valid / old link cancelled / tampered / wrong user refused / secret not stored; set-password page shows the right account and refuses bad links; portal pages send signed-out visitors to sign in
  - Test checklist:
    - [ ] Register on the website as a new student, open the dashboard: Overview shows the to-do list
    - [ ] Fill My profile, add an education entry and an IELTS score: the to-do items disappear; staff see them on the student page
    - [ ] On a course page press Apply, pick an intake, start: it appears in My applications and in staff Applications under New
    - [ ] Staff move it to "Offer received" with a note: the student sees the new stage, progress bar and the note
    - [ ] Staff add a student by hand, make an invite link, open it in a private window, set a password, sign in: lands in the portal with their data
    - [ ] Open the same invite link again: "expired or already used"
    - [ ] Try to register with that student's email before using the invite: the message says to ask the counsellor
- [x] 4.5 Agent portal and commission tracking
  - Agent menu: Overview (students, applications in progress, enrolled, payments due), My students, My commission
  - My students: add a student (only emails NRC does not know yet, so agents cannot claim existing students; counsellor set from lead routing by country); each student: details, education and test scores, documents (upload / download / "upload again" notes), applications with stage and "what happens now", apply for any published course and open intake
  - Agents never see staff notes, other agents' students (any other id is "not found"), or what universities pay NRC
  - My commission: only NRC → agent payouts for their students; due and paid totals per currency
  - Staff Commission page (Commission permission): University pays NRC / NRC pays agent; expected vs received (or due vs paid) totals; filter by status; each row opens the application
  - Application page → Commission card (Commission permission): "Add expected amounts" works them out from the course's yearly tuition fee × the university's rates (both directions, agent only when one referred the student); or enter an amount by hand; change amount, status (Expected / Received / Cancelled, or Due / Paid / Cancelled) and a note; every change goes in the activity log with before and after
  - Test checklist:
    - [ ] Approve a test agent, sign in as them: menu shows My students and My commission
    - [ ] Add a student; try adding an email that already exists: refused
    - [ ] Apply for a course for that student: staff see it in Applications with the agent shown
    - [ ] Open another agent's student by changing the id in the address: "not found"
    - [ ] Staff: on that application press "Add expected amounts": two rows appear (NRC and agent), amounts = fee × rate
    - [ ] Mark the agent row Paid: the agent's My commission shows it under Paid; the NRC row is never visible to the agent
    - [ ] Staff with Commission "None": no Commission card on applications and no Commission menu
- [x] 4.6 Dashboard overview (staff and admin)
  - Tiles, each shown only with the matching permission and clickable: New leads, Open applications, Documents to review (opens Students filtered to those waiting), Agents waiting for approval
  - My work: leads assigned to me that are New or Contacted (oldest first), my open applications (longest without an update first)
  - Application pipeline: a bar per open stage with counts; each bar opens Applications on that stage
  - Recent activity (admins only): last 12 actions with who and when, linked to the lead, student, application or user
  - Students and agents keep their own overviews (4.4, 4.5)
  - Test checklist:
    - [ ] Assign yourself a lead: it appears under My work; set it to Qualified: it disappears
    - [ ] Move an application to a new stage: the pipeline bar counts change
    - [ ] Upload a document on a student: "Documents to review" goes up and its link lists that student
    - [ ] As admin, change a lead's status: it shows in Recent activity; as staff, the section is not shown
    - [ ] Staff with Leads "None": no New leads tile and no leads in My work
- [ ] 4.7 Email notifications (built; switches on with Resend keys)
  - `src/lib/email.ts`: Resend over plain HTTP, plain-text messages, sent after the response (`after()`) so a mail failure never breaks a form; with no keys every message is only logged (`[email off]`)
  - New lead from the contact / consultation form: alert to the routed counsellor, or to `EMAIL_STAFF_ALERTS` when nobody is assigned (reply goes to the visitor); "we received your message" to the visitor. Leads added by staff send nothing
  - Lead reassigned to a counsellor by someone else: email to that counsellor
  - Agent application: alert to `EMAIL_STAFF_ALERTS`, acknowledgement to the applicant; approve / reject: email to the agent
  - Portal invite: emailed to the student automatically; staff see "Emailed to …" or are told to copy the link
  - Application stage changed: email to the student (with the stage note) and to their agent
  - Document "ask again": email to the student and their agent with what to fix
  - Forgot password: link under the password field in the sign-in panel (only when email is on) → one-hour link → `/reset-password`; other devices are signed out. Same reply whether or not the account exists
  - Not done: email verification on sign-up (would lock out accounts made before email existed; decide with the client)
  - To switch on: Resend account → add and verify the domain `nrcedu-uk.com` (DNS records) → API key; fill `EMAIL_API_KEY`, `EMAIL_FROM` (e.g. `NRC Educational Consultants <no-reply@nrcedu-uk.com>`) and `EMAIL_STAFF_ALERTS` (open question 2: which mailbox); restart
  - Test checklist (after switching on):
    - [ ] Submit the consultation form from a routed country: the counsellor gets the alert, you get the acknowledgement; replying to the alert goes to the visitor
    - [ ] Submit the contact form: alert arrives at `EMAIL_STAFF_ALERTS`
    - [ ] Assign a lead to another staff member: they get an email; assigning yourself sends nothing
    - [ ] Apply at `/become-an-agent`, then approve: both emails arrive; the approval link opens the sign-in panel
    - [ ] Make a portal invite: "Emailed to …" shows and the email link sets the password
    - [ ] Move an application with a note: the student's email shows the new stage and the note
    - [ ] "Ask again" on a document: the student gets what to fix
    - [ ] Forgot password: email arrives, new password works, the old one does not, and an old link says "expired"
- [x] 4.8 Messaging between student and counsellor — Dashboard → Messages
  - One conversation per student, between the student and NRC staff (uses the existing `Message` table; no migration)
  - Student: Messages page with their thread and the counsellor's name; opening it marks staff replies read
  - Staff (Students permission; "View only" can read, "Can edit" can reply): inbox newest first, "My students and unassigned" or "All", unread counts; conversation page links to the student record; the student record links to Messages
  - Menu shows an unread count (students: replies; staff: messages from their students and students with no counsellor). It refreshes on the next page load or after sending
  - Email: student writes → their counsellor (or `EMAIL_STAFF_ALERTS`); staff write → the student. Only the first unread message in a burst sends an email
  - Up to 2,000 characters; 30 messages per 10 minutes per person
  - Agents are not part of conversations
  - Test checklist:
    - [ ] As a student, send a message: it shows on the right; the counsellor sees an unread count in the menu
    - [ ] As the counsellor, open it from Messages: the count clears; reply: the student sees it and their menu shows 1
    - [ ] Send three messages in a row: only one email arrives
    - [ ] Staff with Students "View only": can read, no reply box; with "None": no Messages menu item
    - [ ] Open a student record → Messages: you can start a conversation with a student who has not written
- [x] Dashboard "About this page": a button in the top bar opens a panel explaining the current screen (text in `src/lib/page-help.ts`, per role where pages differ; add an entry with each new dashboard page)
- [x] 4.9 Follow-up reminders — Dashboard → Reminders (staff and admins)
  - Reminders card on every lead, student and application page: what to follow up, the day, and for whom (yourself by default, or a colleague). Done / Reopen / Delete; the last 3 done stay visible. Needs edit access to that area
  - Reminders page: Due (today and overdue) / Upcoming / Done with counts, each linked to its record; personal reminders not tied to a record; admins can show everyone's
  - Menu badge and overview "My work" show reminders due today or overdue. Days are counted in London time
  - Morning email (07:00 UTC) listing each person's due reminders: `/api/cron/reminders`, run by Vercel Cron from `vercel.json`. Needs `CRON_SECRET` set in Vercel (any long random string) and email switched on; the route answers 404 without the secret
  - Uses the existing `Reminder` table; no migration
  - Test checklist:
    - [ ] On a lead, add a reminder for today: it shows on the lead, in the menu count and under My work on the overview
    - [ ] Add one for a colleague: it appears on their Reminders page, not yours
    - [ ] Press Done: it moves to Done and the menu count drops; Reopen brings it back
    - [ ] Staff with Leads "View only": sees the lead's reminders but cannot add or change them
    - [ ] After deploying: in Vercel → Cron Jobs, run the job by hand; you get the morning email
- [x] 4.10 CSV export and activity log
  - "Download CSV" on Leads, Students, Applications and Commission (anyone who can view that area): every record, up to 20,000 rows, opens straight in Excel. Passport numbers are left out
  - Cells starting with = + - @ get a leading ' so a form entry cannot become a spreadsheet formula
  - Every download is written to the activity log
  - Dashboard → Activity log (admins only, also linked from the overview): filter by person, area and dates, 50 per page, "from → to" details where recorded, link to the record; Download CSV saves the filtered list
  - Activity labels moved to `src/lib/activity.ts` (shared by the overview and the log)
  - Test checklist:
    - [ ] Leads → Download CSV: opens in Excel with names and accents correct; the download shows in the Activity log
    - [ ] Submit the contact form with the name `=1+1`: in the CSV it shows as text, not 2
    - [ ] Staff with Commission "None": no Commission page, and `/api/export/commissions` says not found
    - [ ] Activity log: filter by one person and yesterday's date; Download CSV contains only those rows
    - [ ] Signed in as staff: no Activity log menu item, and `/dashboard/activity` sends you back
- [x] 4.11 Agent teams — Dashboard → My team (agency owners only)
  - The owner adds people by name and email; each gets an agent login linked to the agency and an emailed set-password link (7 days, one use; can be copied or sent again)
  - Team members see only the students they added (list, student pages, documents, applications, overview); the owner sees everyone's, with "by …" on each student and a filter per person
  - Commission and My team stay with the owner. Turning a member's access off signs them out; their students stay with the agency. Revoking the agency locks the whole team
  - Test checklist:
    - [ ] As an approved agent, add a team member; open the invite link in a private window and set a password
    - [ ] As the member: add a student; no My commission or My team in the menu
    - [ ] As the owner: the student shows "by <member>", and the member's filter lists only theirs
    - [ ] As the member, open one of the owner's students by changing the id in the address: "not found"
    - [ ] Turn the member's access off: their next page load signs them out
- [x] 4.12 Notifications — bell in the top bar and Dashboard → Notifications (everyone)
  - Recipients come from role and access (`src/lib/notifications.ts`): staff only get notices for areas they can edit; counsellor first, otherwise the area's staff; agency owner plus the team member who added the student; never the person who did it
  - Events: new lead, lead or application assigned, agent application and approval, application started and stage changes, document uploaded / approved / sent back, new message, agent adds a student, agent commission paid
  - Every notice is also emailed; events that already had a detailed email (4.7) keep that one instead of a second
  - Opening a notice marks it read; "Mark all as read"; read notices are deleted after 90 days by the daily cron
  - Test checklist:
    - [ ] Submit the consultation form: the routed counsellor's bell count goes up; the link opens the lead
    - [ ] Upload a document as a student: the counsellor is notified; approve it: the student is notified and emailed
    - [ ] Staff with Leads "None" get no new-lead notices
    - [ ] Moving your own application stage does not notify you

### Phase 5 — Launch (week 7)
- [ ] 5.1 Real content from client
- [x] 5.2 SEO: metadata, sitemap, redirects from old URLs
  - `/sitemap.xml`: fixed pages plus every published university, course, destination, subject, test-prep page and blog post; refreshes when content changes
  - `/robots.txt`: points to the sitemap; keeps the dashboard, API, styleguide and password pages out of search
  - Site-wide base address from `APP_URL` (must be `https://www.nrcedu-uk.com` in Vercel) and social-preview defaults (site name, logo image)
  - Old-site addresses (from its sitemap) redirect permanently: `/about-us`, `/blogs`, `/university`, `/affiliated-university`, `/recruitment-partner/become-agent`, `/proceed`, `/login`, `/signup`, `/reset-pass`; `/services`, `/contact`, `/subjects` and `/test-prep/<test>` kept their addresses
  - Test checklist:
    - [ ] `/sitemap.xml` lists a newly published post; unpublish it and it drops out
    - [ ] `/about-us`, `/blogs` and `/signup` land on the new pages (signup opens the register panel)
    - [ ] After launch: add the site to Google Search Console and submit `https://www.nrcedu-uk.com/sitemap.xml`
    - [ ] Paste a blog post link into WhatsApp or Facebook: the preview shows title, text and image
- [ ] 5.3 Testing: forms, roles, mobile, performance
  - [x] Offline checks (2026-10-15): type-check, lint and production compile pass (the full build needs the database for page data). Every dashboard server action and API route checks sign-in and role/permission before doing anything
  - [x] Limits on repeated submissions, stored in a new `RateLimit` table (migration `20261015120000_rate_limit`, written by hand; run `npm run db:deploy`), shared by every Vercel instance:
    - Contact and consultation forms: 5 per hour per visitor address; become-an-agent: 3 per hour (`src/lib/rate-limit.ts`)
    - Sign-in: 10 per 5 minutes; sign-up and "Forgot password": 5 per hour (Better Auth, production only)
    - The daily reminders cron also clears counts older than a day
  - Test checklist (after `npm run db:deploy`, needs the internet):
    - [ ] Send the contact form 6 times: the 6th says "Too many messages"; the consultation form still works
    - [ ] In Prisma Studio the `RateLimit` table shows rows starting with `form:`
    - [ ] On the deployed site, 11 wrong passwords in a row: the 11th says "Too many requests"
  - [ ] Roles, mobile and performance passes on the live preview
- [ ] 5.4 Point domain to new deployment
- [ ] 5.5 Client handover: admin accounts, short guide
  - [x] Guide for the NRC team: `docs/client-guide.md` (sign-in, roles and access, daily CRM work, editing the website, emails, who pays for what)
  - [x] `README.md` rewritten for whoever runs the site: setup, settings table, deploy order (migrations before code), launch checklist, code map
  - [ ] At launch: create NRC's admin accounts (at least two) and walk them through the guide

## 7. Risks

- Seven weeks covers the full scope with about a week of slack; scope added from here eats into it.
- Client content arriving late; placeholders keep the build moving.
- All current content is invented sample data (universities, testimonials, partners, photos from picsum.photos). It must be removed before launch.
