# NRC website and dashboard: guide for the NRC team

This guide covers everyday use. Every dashboard screen also has an **About this page** button in the top bar that explains that screen.

## Signing in

- Open the website and press **Sign in** (top right). A panel slides in; there is no separate login page.
- Everyone uses the same sign-in: admins, staff, agents and students. What you see depends on your role.
- Forgot your password? Use **Forgot password** in the sign-in panel; the link in the email works for one hour.
- After 10 wrong passwords in 5 minutes, sign-in pauses for a few minutes. This protects accounts from guessing.

## Roles

| Role | Who | What they can do |
|---|---|---|
| Admin | NRC management | Everything, including users, permissions, site settings and the activity log |
| Staff | Counsellors and office team | Leads, students, applications and website content, limited per person by the admin |
| Agent | NRC's sub-agents abroad | Their own students, applications and commission only |
| Student | Applicants | Their profile, documents, applications and messages with their counsellor |

### Adding staff and setting their access (admins)

1. **Dashboard → Users and roles → Add staff**.
2. Open the person and set each area to **Can edit**, **View only** or **No access** (leads, students, applications, agents, commission, website content, users, site settings).
3. To remove someone, set their status to **Suspended**; they are signed out on their next click. Do not delete staff who handled students; suspending keeps the history.

### Agents

- Agents apply at **/become-an-agent**. Their account stays locked until an admin approves it at **Dashboard → Agents** (or Users and roles). They get an email either way.
- Approved agents add their own students and apply for them. They only ever see their own students and their own commission.

## Daily work

### Leads (enquiries)

- Website forms (consultation and contact) land in **Dashboard → Leads** as **New**.
- **Lead routing** (Leads → Routing): pick a counsellor per country; new leads from that country are assigned and emailed to them automatically. Others go to the shared staff inbox.
- On a lead: update the status as you go (New → Contacted → Qualified → Converted or Lost), add notes after calls, and press **Convert to student** when they decide to apply.

### Students and applications

- **Students**: open a record to edit details, upload or review documents, start an application, or send an invite link so the student can set a password.
- Documents: **Approve**, or **Ask again** with a note saying what to fix; the student is emailed.
- **Applications**: move each application through its stages (New → Documents pending → Submitted → Offer → Deposit/CAS → Visa → Enrolled). Adding a note when you change stage emails it to the student.
- **Messages**: students write to their counsellor here; unread counts show in the menu.
- **Reminders**: add a follow-up on any lead, student or application. Due reminders show in the menu and in a 7:00 morning email.

### Commission

- On an application, **Add expected amounts** creates two rows: what the university pays NRC, and what NRC pays the agent. Mark each one paid when the money moves.
- Agents only ever see their own row, never NRC's.

### Downloads and the activity log

- **Download CSV** on Leads, Students, Applications and Commission opens in Excel. Passport numbers are left out.
- **Activity log** (admins): who changed what and when, including every download.

## Editing the website

| What | Where |
|---|---|
| Phone, email, WhatsApp, social links, menus | Dashboard → Site settings |
| Home page slider | Dashboard → Home slider |
| Offices (home and contact pages) | Dashboard → Offices |
| Universities, courses and intakes | Dashboard → Universities |
| Subjects and countries | Dashboard → Subjects / Countries |
| Blog posts | Dashboard → Blog (Save draft, Preview, Publish) |
| Testimonials, partner logos, FAQs | Dashboard → Testimonials / Partners / FAQs |

- Untick **Show on the website** (or press **Hide**) to take something down without deleting it.
- Changes show on the website straight away.
- Images: upload JPG, PNG or WebP. Phone photos are turned the right way up and resized automatically.

## Emails the system sends

- To staff: new leads, new agent applications, lead assigned to you, new student messages, morning reminders.
- To visitors and students: enquiry received, agent approved or rejected, portal invite, application stage updates, document "ask again", new counsellor messages, password reset, email confirmation.

## Good habits

- Keep at least two admin accounts, so one person being away never locks NRC out.
- Use strong, different passwords; never share accounts. Give each person their own login so the activity log stays meaningful.
- Students' documents are private: they can only be downloaded by signed-in staff, the student and their agent.

## Who pays for what

NRC owns and pays for the accounts the site runs on:

- **Vercel**: hosts the website.
- **Railway**: the database.
- **Cloudflare R2**: images and student documents.
- **Resend**: sending email.
- The **nrcedu-uk.com** domain.

If a bill goes unpaid, that part stops working (this is what happened to the old site), so keep a card on file and the billing emails going to an inbox someone reads.
