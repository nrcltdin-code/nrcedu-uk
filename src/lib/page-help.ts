import type { Role } from "@/generated/prisma/client";

// "About this page" text for every dashboard screen, shown from the top bar. Matched on the
// address, first match wins. Add an entry whenever a dashboard page is added.

export type PageHelp = { title: string; summary: string; points: string[] };

type Entry = { path: RegExp; help: PageHelp | Partial<Record<Role, PageHelp>> };

const id = "[^/]+";
const at = (pattern: string) => new RegExp(`^/dashboard${pattern}/?$`);

const entries: Entry[] = [
  {
    path: at(""),
    help: {
      ADMIN: {
        title: "Overview",
        summary: "Your starting point: what needs attention today across leads, applications, documents and agents.",
        points: [
          "Each tile is a live count; click it to open the matching filtered list.",
          "My work lists your New or Contacted leads (oldest first) and your open applications (longest without an update first).",
          "The pipeline shows how many open applications are at each stage; click a bar to see them.",
          "Recent activity shows the last 12 changes made by anyone, linked to what was changed. Only admins see it.",
        ],
      },
      STAFF: {
        title: "Overview",
        summary: "Your starting point: what needs your attention today.",
        points: [
          "Tiles show only the areas you have access to; click one to open the matching list.",
          "My work lists leads assigned to you that are New or Contacted, and applications you handle.",
          "The pipeline shows how many open applications are at each stage; click a bar to see them.",
        ],
      },
      AGENT: {
        title: "Overview",
        summary: "A summary of the students you referred to NRC and the commission due to you.",
        points: [
          "See how many students you have, applications in progress, enrolments and payments due.",
          "Use My students to add a student, upload their documents and apply for courses.",
          "Use My commission to see what NRC owes and has paid you.",
        ],
      },
      STUDENT: {
        title: "Overview",
        summary: "Your applications at a glance and what you still need to do.",
        points: [
          "The to-do list shows missing details and documents; each item disappears once done.",
          "Each application shows its current stage; open My applications for the full progress.",
          "Your counsellor's name is shown so you know who is handling your file.",
        ],
      },
    },
  },
  {
    path: at("/leads/routing"),
    help: {
      title: "Lead routing",
      summary: "Choose who automatically gets new leads from each country.",
      points: [
        "Set a default counsellor and/or agent per country.",
        "New leads from the website for that country are assigned straight away, and the counsellor is emailed.",
        "Countries with no one set go to the shared staff inbox; anyone can be reassigned by hand on the lead.",
      ],
    },
  },
  {
    path: at(`/leads/${id}`),
    help: {
      title: "Lead details",
      summary: "Everything about one enquiry: details, message and a timeline of every change and note.",
      points: [
        "Change the status as you work the lead: New → Contacted → Qualified → Converted (or Lost).",
        "Assign a counsellor and/or agent. A counsellor assigned by someone else is emailed.",
        "Add notes after calls or meetings; notes are internal and never shown to the student.",
        "Convert to student creates their student record and marks the lead Converted.",
      ],
    },
  },
  {
    path: at("/leads"),
    help: {
      title: "Leads",
      summary: "Enquiries from the website's consultation and contact forms, plus leads added by staff.",
      points: [
        "Tabs filter by status; Open means New, Contacted and Qualified.",
        "Search by name, email or phone, or show only leads assigned to you or to nobody.",
        "Add lead records a phone call or walk-in.",
        "Open a lead to update its status, assign it, add notes or convert it into a student.",
        "Download CSV saves every lead for Excel; each download is recorded in the activity log.",
      ],
    },
  },
  {
    path: at(`/students/${id}`),
    help: {
      title: "Student record",
      summary: "One student's full file: profile, education, documents, applications and notes.",
      points: [
        "Edit personal and passport details, education history and test scores.",
        "Documents: upload, download, approve, or ask again with a note (the student and agent are emailed).",
        "Start an application by choosing a course and an open intake.",
        "If the student has no password yet, make an invite link; it is emailed to them.",
        "Notes here are internal and never shown to the student or agent.",
      ],
    },
  },
  {
    path: at("/students"),
    help: {
      title: "Students",
      summary: "Everyone NRC is helping to apply, whether they came from a lead, an agent or signed up on the website.",
      points: [
        "Search by name, email or phone; filters narrow to students with documents waiting for review.",
        "Add student creates a record directly; converting a lead does the same from the lead page.",
        "Open a student to manage their documents and applications.",
        "Download CSV saves every student for Excel (passport numbers are left out); each download is recorded.",
      ],
    },
  },
  {
    path: at(`/applications/${id}`),
    help: {
      title: "Application",
      summary: "One application to one course and intake, with its full stage history.",
      points: [
        "Move the stage as it progresses. The optional note is shown to the student, and they (and their agent) are emailed.",
        "Change who at NRC handles it.",
        "Internal notes stay with staff.",
        "With Commission access: add expected commission (university → NRC and NRC → agent) and mark it received or paid.",
      ],
    },
  },
  {
    path: at("/applications"),
    help: {
      title: "Applications",
      summary: "Every student application across all universities, as a pipeline.",
      points: [
        "Tabs show each stage with its count; Open hides enrolled, refused and withdrawn applications.",
        "Search by student, course or university, or show only those you handle.",
        "New applications start from a student's page, or come from students and agents applying themselves.",
        "Download CSV saves every application for Excel; each download is recorded.",
      ],
    },
  },
  {
    path: at("/reminders"),
    help: {
      title: "Reminders",
      summary: "Your follow-ups, so nothing slips: calls to make, documents to chase, deadlines to check.",
      points: [
        "Due shows today's and overdue reminders; the number in the menu counts them.",
        "Add reminders on a lead, student or application page so they link back to it; personal ones are added here.",
        "You can set a reminder for a colleague. Done moves it to the Done list; Reopen brings it back.",
        "Each morning you get one email listing what is due (once email is switched on).",
        "Admins can show everyone's reminders, for example to cover for someone away.",
      ],
    },
  },
  {
    path: at(`/messages/${id}`),
    help: {
      title: "Conversation",
      summary: "Messages between NRC and one student.",
      points: [
        "Opening the conversation marks the student's messages as read.",
        "The student sees your name and is emailed when you write (one email per batch of unread messages).",
        "Any staff member with access to students can read it; use internal notes on the student record for anything the student must not see.",
      ],
    },
  },
  {
    path: at("/messages"),
    help: {
      STUDENT: {
        title: "Messages",
        summary: "Write to your NRC counsellor about your applications.",
        points: ["Your counsellor is emailed when you write, and you are emailed when they reply.", "For documents, use the Documents page rather than sending them here."],
      },
      ADMIN: {
        title: "Messages",
        summary: "Conversations with students, newest first.",
        points: [
          "The first view shows your students and students with no counsellor; All shows everyone's.",
          "The number in the menu counts unread messages from those students.",
          "To message a student who has not written yet, open their record and choose Messages.",
        ],
      },
      STAFF: {
        title: "Messages",
        summary: "Conversations with students, newest first.",
        points: [
          "The first view shows your students and students with no counsellor; All shows everyone's.",
          "The number in the menu counts unread messages from those students.",
          "To message a student who has not written yet, open their record and choose Messages.",
        ],
      },
    },
  },
  {
    path: at("/agents"),
    help: {
      title: "Agents",
      summary: "Sub-agents who bring students to NRC.",
      points: [
        "Applications from the website's Become an agent form wait here for approval; the agent is emailed with the decision.",
        "Approved agents can sign in, add students and apply for them.",
        "Revoking an agent stops them signing in; their students stay with NRC.",
      ],
    },
  },
  {
    path: at("/commissions"),
    help: {
      title: "Commission",
      summary: "Money universities pay NRC, and money NRC pays its agents.",
      points: [
        "Switch between University pays NRC and NRC pays agent.",
        "Totals compare expected with received (or due with paid), per currency.",
        "Filter by status; each row opens its application, where amounts and statuses are changed.",
        "Download CSV saves all commission rows in both directions; each download is recorded.",
      ],
    },
  },
  {
    path: at(`/agent/students/${id}`),
    help: {
      title: "Student",
      summary: "One of your students: details, documents and applications.",
      points: [
        "Keep their details, education and test scores up to date.",
        "Upload documents; if NRC asks for one again, the note says what to fix.",
        "Apply for any published course and open intake, and follow each application's stage.",
      ],
    },
  },
  {
    path: at("/agent/students"),
    help: {
      title: "My students",
      summary: "The students you referred to NRC.",
      points: [
        "Add a student with an email NRC does not already have; a counsellor is chosen by their country.",
        "Open a student to upload documents and apply for courses.",
        "You only ever see your own students.",
      ],
    },
  },
  {
    path: at("/agent/commissions"),
    help: {
      title: "My commission",
      summary: "What NRC owes and has paid you for your students' enrolments.",
      points: [
        "Each row is one application, with amount, currency and status (Due, Paid or Cancelled).",
        "Totals for due and paid are shown per currency.",
        "Questions about an amount? Contact your NRC contact.",
      ],
    },
  },
  {
    path: at("/my-applications"),
    help: {
      title: "My applications",
      summary: "Every course you have applied for and where each one stands.",
      points: [
        "The progress bar shows the stage; “What happens now” explains it in plain words.",
        "The history shows each update with any note from NRC. You are also emailed when the stage changes.",
        "To apply for another course, press Apply on a course page on the website.",
      ],
    },
  },
  {
    path: at("/apply"),
    help: {
      title: "Apply",
      summary: "Start an application for the course you chose on the website.",
      points: [
        "Pick one of the course's open intakes and start the application.",
        "It then appears in My applications, and NRC is notified.",
        "You cannot apply twice for the same course and intake.",
      ],
    },
  },
  {
    path: at("/profile"),
    help: {
      title: "My profile",
      summary: "The details universities need from you.",
      points: [
        "Fill in your personal and passport details exactly as on your passport.",
        "Add each school, college or university you attended, and test scores such as IELTS.",
        "Your counsellor sees everything you enter here.",
      ],
    },
  },
  {
    path: at("/documents"),
    help: {
      title: "Documents",
      summary: "Upload the documents your applications need.",
      points: [
        "PDF, JPG or PNG, up to 10 MB each.",
        "The checklist shows documents usually needed.",
        "If NRC asks for a document again, the note says what to fix, and you are emailed.",
        "You can remove a document until it is approved.",
      ],
    },
  },
  {
    path: at("/slides"),
    help: {
      title: "Home slider",
      summary: "The large rotating banner at the top of the home page.",
      points: [
        "Add a slide with heading, text, button and background image.",
        "Hide a slide to take it off the website without deleting it; arrows change the order.",
      ],
    },
  },
  {
    path: at("/universities/new"),
    help: {
      title: "New university",
      summary: "Add a university to the website.",
      points: [
        "Leave the web address empty to make one from the name.",
        "After saving, add its courses and intakes on the university's page.",
      ],
    },
  },
  {
    path: at(`/universities/${id}`),
    help: {
      title: "University",
      summary: "One university's details, courses, intakes and commission rates.",
      points: [
        "Untick Show on the website to hide it from the public straight away.",
        "Add courses (with yearly tuition fee) and intakes; only open intakes can be applied for.",
        "Commission rates here are used to work out expected commission on applications.",
      ],
    },
  },
  {
    path: at("/universities"),
    help: {
      title: "Universities",
      summary: "The universities and courses shown on the website.",
      points: ["Search and open a university to edit it, its courses and intakes.", "Add university creates a new one."],
    },
  },
  {
    path: at("/subjects"),
    help: {
      title: "Subjects",
      summary: "Subject areas used to group courses on the website.",
      points: ["Add, rename or delete subjects.", "Deleting a subject keeps its courses, with no subject."],
    },
  },
  {
    path: at("/countries"),
    help: {
      title: "Countries",
      summary: "Countries used in forms, and the study destinations shown on the website.",
      points: ["Mark a country as a destination to list it on the Destinations page and offer it in the consultation form."],
    },
  },
  {
    path: at("/blog/new"),
    help: {
      title: "New post",
      summary: "Write a blog article.",
      points: ["Use the toolbar for headings, lists and links; Preview shows how it will look.", "Save draft keeps it private; Publish puts it on the website."],
    },
  },
  {
    path: at(`/blog/${id}`),
    help: {
      title: "Edit post",
      summary: "Change an article.",
      points: ["Changes to a published post show on the website when saved.", "Unpublish takes it off the website; its link then shows “not found”."],
    },
  },
  {
    path: at("/blog"),
    help: {
      title: "Blog",
      summary: "Articles shown on the website's blog and home page.",
      points: ["Drafts are only visible here.", "Open a post to edit, publish or unpublish it."],
    },
  },
  {
    path: at("/testimonials"),
    help: {
      title: "Testimonials",
      summary: "Student stories shown on the home page.",
      points: ["Add, hide or reorder; the first ones show first on the website."],
    },
  },
  {
    path: at("/partners"),
    help: {
      title: "Partners",
      summary: "Partner logos shown on the website.",
      points: ["Add, hide or reorder logos."],
    },
  },
  {
    path: at("/faqs"),
    help: {
      title: "FAQs",
      summary: "Frequently asked questions shown on the website.",
      points: ["Add, hide or reorder questions and answers."],
    },
  },
  {
    path: at("/offices"),
    help: {
      title: "Offices",
      summary: "NRC's offices, shown on the home and contact pages.",
      points: [
        "Add address, phone, email, opening hours, map link and photo.",
        "Only one head office; it always shows first.",
        "Hide an office to take it off the website without deleting it.",
      ],
    },
  },
  {
    path: at("/analytics"),
    help: {
      title: "Website analytics",
      summary: "How many people visit the public website, which pages they read, where they are and how they found us.",
      points: [
        "Visitors counts each person once a day (by network address and browser), without cookies, so it is a close estimate.",
        "Sources come from the page the visitor clicked from. Tag your own links with ?utm_source=facebook&utm_campaign=… to see exactly which post or email brought people in.",
        "Location is the country and city of the visitor's internet connection; it shows on the live site, not on a local copy.",
        "Bots and the dashboard are not counted. Views are kept for 13 months.",
      ],
    },
  },
  {
    path: at("/marketing/campaigns"),
    help: {
      title: "Campaigns",
      summary: "Every marketing push: social series, email and SMS campaigns, paid ads and events.",
      points: [
        "Move a campaign through Planning, In design, Ready, Live and Finished as the work goes on.",
        "Keep the copy in Message and the Canva or Drive folder in Design link, so everyone works from the same version.",
        "Write what happened in Results when it ends, to plan the next one better.",
        "Filter by status or channel with the buttons at the top.",
      ],
    },
  },
  {
    path: at("/marketing/content"),
    help: {
      title: "Content plan",
      summary: "The posting calendar for every social media page, one month at a time.",
      points: [
        "Add each post with its date, platform and caption, and link it to a campaign if it belongs to one.",
        "Change the status as the design is made and the post goes out; add the live link once it is posted.",
        "Use the arrows to move between months.",
      ],
    },
  },
  {
    path: at("/marketing/accounts"),
    help: {
      title: "Social pages",
      summary: "A list of NRC's social media pages and how to get into each one.",
      points: [
        "Record the login, where the two-step code goes, and who has access, so a page is never lost when someone leaves.",
        "Passwords are stored encrypted. Only admins can see or change them, and every look is written to the Activity log.",
      ],
    },
  },
  {
    path: at(`/users/${id}`),
    help: {
      title: "User",
      summary: "One account's role, status and access.",
      points: [
        "Change role or status; suspending signs the person out.",
        "For staff, set access per area: Can edit, View only or None.",
        "The last active admin cannot be demoted or suspended.",
      ],
    },
  },
  {
    path: at("/users"),
    help: {
      title: "Users and roles",
      summary: "Every account: admins, staff, agents and students.",
      points: ["Search and filter by role or status.", "Admins can add staff and admin accounts.", "Open a user to change their role, status or access. Every change is logged."],
    },
  },
  {
    path: at("/activity"),
    help: {
      title: "Activity log",
      summary: "A record of who changed what and when: leads, students, applications, documents, commission, users, settings and downloads.",
      points: [
        "Filter by person, area and dates; “open” goes to the record that changed.",
        "Some entries show what changed, from → to (people appear by their id).",
        "Download CSV saves the filtered list. Entries cannot be edited or deleted.",
        "Application stage moves are in each application's own history, not here.",
      ],
    },
  },
  {
    path: at("/settings"),
    help: {
      title: "Site settings",
      summary: "Contact details, social links and menus used across the website.",
      points: [
        "Changes show in the header, footer and contact page straight away.",
        "Menu lines are “Label | /address”; links must start with / or https://.",
        "Empty or broken settings fall back to the built-in defaults.",
      ],
    },
  },
];

export function getPageHelp(pathname: string, role: Role): PageHelp | null {
  const entry = entries.find((item) => item.path.test(pathname));
  if (!entry) return null;
  return "title" in entry.help ? (entry.help as PageHelp) : (entry.help[role] ?? null);
}
