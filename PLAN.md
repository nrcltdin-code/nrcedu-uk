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
  - [ ] Google sign-in: add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
  - [ ] Later, with email (4.7): email verification and password reset
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
  - [ ] Emails to staff and applicants (4.7)

### Phase 3 — Admin panel (week 3)
- [x] 3.0 Users, roles and per-staff permissions (`/dashboard/users`): search and filter all accounts, admins add staff/admins, change role and status (suspending signs the person out; the last active admin cannot be demoted), per-module access for staff (view and edit / view only / none), approve or reject agent applications; every change is written to the activity log
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
  - [ ] To switch on (Cloudflare R2): create a bucket; turn on public access with a custom domain (e.g. `media.nrcedu-uk.com`) or the r2.dev address; create an API token with Object Read & Write for that bucket only; fill `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_URL` in `.env` (and later in Vercel); restart the app
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
  - Menu for students: Overview, My applications, My profile, Documents (Messages comes with 4.8)
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
- [ ] 4.6 Dashboard overview
- [ ] 4.7 Email notifications
- [ ] 4.8 Messaging between student and counsellor
- [ ] 4.9 Follow-up reminders
- [ ] 4.10 CSV export and activity log

### Phase 5 — Launch (week 7)
- [ ] 5.1 Real content from client
- [ ] 5.2 SEO: metadata, sitemap, redirects from old URLs
- [ ] 5.3 Testing: forms, roles, mobile, performance
- [ ] 5.4 Point domain to new deployment
- [ ] 5.5 Client handover: admin accounts, short guide

## 7. Risks

- Seven weeks covers the full scope with about a week of slack; scope added from here eats into it.
- Client content arriving late; placeholders keep the build moving.
- All current content is invented sample data (universities, testimonials, partners, photos from picsum.photos). It must be removed before launch.
