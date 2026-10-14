// Sample content for building and reviewing the site. Everything here is invented:
// the universities, people and quotes are not real. Remove with `npm run db:seed:demo -- --remove`
// before launch.
import "dotenv/config";
import { db } from "../src/lib/db";

const photo = (seed: string, width = 1600, height = 900) =>
  `https://picsum.photos/seed/nrc-${seed}/${width}/${height}`;

const slides = [
  {
    title: "Your pathway to global education",
    subtitle: "Admissions, applications and visa support for universities in the UK, USA, Canada, Australia and Germany.",
    buttonLabel: "Book a free consultation",
    buttonHref: "/consultation",
    imageUrl: photo("slide-1"),
  },
  {
    title: "Apply now for the September 2027 intake",
    subtitle: "Places fill early. Start your application today and let our counsellors handle the paperwork.",
    buttonLabel: "Browse universities",
    buttonHref: "/universities",
    imageUrl: photo("slide-2"),
  },
  {
    title: "Scholarships worth up to £5,000",
    subtitle: "We match your profile with universities that offer scholarships to international students.",
    buttonLabel: "Check your eligibility",
    buttonHref: "/consultation",
    imageUrl: photo("slide-3"),
  },
];

const countryDescriptions: Record<string, string> = {
  "united-kingdom": "One-year master's degrees, a two-year post-study work visa and centuries of academic tradition.",
  "united-states": "The widest choice of universities and courses, with flexible degrees and strong research funding.",
  canada: "Affordable tuition, welcoming cities and clear routes from study to work.",
  australia: "High-ranking universities, a relaxed lifestyle and generous post-study work rights.",
  germany: "Low or no tuition fees at public universities and a strong engineering reputation.",
};

const subjects = [
  { name: "Business & Management", slug: "business-management" },
  { name: "Computer Science & IT", slug: "computer-science-it" },
  { name: "Engineering", slug: "engineering" },
  { name: "Health & Nursing", slug: "health-nursing" },
  { name: "Law", slug: "law" },
  { name: "Art & Design", slug: "art-design" },
];

const universities = [
  { name: "Kingsmere University", slug: "kingsmere-university", country: "united-kingdom", city: "Manchester", ranking: 42, partner: true },
  { name: "Aldermoor University", slug: "aldermoor-university", country: "united-kingdom", city: "Leeds", ranking: 67, partner: true },
  { name: "Thornfield City University", slug: "thornfield-city-university", country: "united-kingdom", city: "London", ranking: 88, partner: true },
  { name: "Lakeshore Institute of Technology", slug: "lakeshore-institute-of-technology", country: "canada", city: "Toronto", ranking: 120, partner: false },
  { name: "Redgum University", slug: "redgum-university", country: "australia", city: "Melbourne", ranking: 95, partner: true },
  { name: "Westbrook State University", slug: "westbrook-state-university", country: "united-states", city: "Boston", ranking: 140, partner: false },
];

const courseTemplates = [
  { name: "MSc Computer Science", slug: "msc-computer-science", subject: "computer-science-it", level: "POSTGRADUATE", months: 12, fee: 18500 },
  { name: "MBA", slug: "mba", subject: "business-management", level: "POSTGRADUATE", months: 12, fee: 21000 },
  { name: "BSc Business Management", slug: "bsc-business-management", subject: "business-management", level: "UNDERGRADUATE", months: 36, fee: 15500 },
  { name: "BEng Mechanical Engineering", slug: "beng-mechanical-engineering", subject: "engineering", level: "UNDERGRADUATE", months: 36, fee: 17200 },
] as const;

const testimonials = [
  { name: "Ayesha R.", headline: "MSc Data Science, United Kingdom", rating: 5, quote: "From shortlisting universities to my visa interview, the team guided me at every step. I received my offer within three weeks." },
  { name: "Daniel O.", headline: "MBA, Canada", rating: 5, quote: "I was confused about which country suited my budget. My counsellor laid out the options clearly and I never felt pushed." },
  { name: "Tanvir H.", headline: "BEng Mechanical Engineering, Australia", rating: 4, quote: "They checked every document before submission, which saved me from mistakes that would have delayed my application." },
  { name: "Priya S.", headline: "LLM, United Kingdom", rating: 5, quote: "The statement of purpose feedback was honest and detailed. I got into my first-choice university with a scholarship." },
];

const partners = ["Global Study Network", "EduBridge Alliance", "Pathway Colleges Group", "Brightway Test Centre", "StudentStay Housing"];

const faqs = [
  { question: "Is the consultation really free?", answer: "Yes. The first consultation is free and there is no obligation to continue with us afterwards." },
  { question: "Which countries can you help me apply to?", answer: "We currently support applications to the United Kingdom, the United States, Canada, Australia and Germany." },
  { question: "Do I need an English test such as IELTS?", answer: "Most universities ask for one, but some accept other proof of English. We tell you exactly what each university on your shortlist requires." },
  { question: "How long does an application take?", answer: "Most students receive a decision two to six weeks after a complete application is submitted. Visa processing time depends on the country." },
  { question: "Can you help with my student visa?", answer: "Yes. We prepare your visa file with you, check your financial documents and run practice interviews." },
];

const posts = [
  { title: "How to choose the right country for your degree", slug: "how-to-choose-the-right-country", excerpt: "Tuition, living costs, work rights and career goals: a simple way to compare your options." },
  { title: "A step-by-step guide to the UK student visa", slug: "uk-student-visa-guide", excerpt: "What a CAS is, how much money you need to show, and the mistakes that cause refusals." },
  { title: "Writing a statement of purpose that gets noticed", slug: "writing-a-statement-of-purpose", excerpt: "Admissions tutors read hundreds of statements. Here is how to make yours specific and memorable." },
];

const testPrep = [
  { name: "IELTS", slug: "ielts", summary: "The most widely accepted English test for study abroad." },
  { name: "TOEFL", slug: "toefl", summary: "Preferred by many universities in the United States and Canada." },
  { name: "PTE", slug: "pte", summary: "A computer-based English test with fast results." },
  { name: "Duolingo", slug: "duolingo", summary: "An affordable online English test you can take at home." },
  { name: "GRE", slug: "gre", summary: "Required for many postgraduate courses in the United States." },
  { name: "GMAT", slug: "gmat", summary: "The standard admissions test for MBA and business master's courses." },
];

// Invented addresses; replace with NRC's real offices.
const offices = [
  { name: "London Head Office", city: "London", country: "United Kingdom", address: "Sample House, 12 Example Street, London E1 0AA", phone: "+44 2033554453", email: "info@nrcedu-uk.com", openingHours: "Mon to Fri, 9:30am to 5:30pm", isHeadOffice: true },
  { name: "Dhaka Office", city: "Dhaka", country: "Bangladesh", address: "Level 4, Sample Tower, Road 11, Banani, Dhaka 1213", phone: "+880 1700 000000", email: "dhaka@nrcedu-uk.com", openingHours: "Sat to Thu, 10am to 6pm", isHeadOffice: false },
  { name: "Lagos Office", city: "Lagos", country: "Nigeria", address: "Suite 7, Sample Plaza, Example Avenue, Ikeja, Lagos", phone: "+234 800 000 0000", email: "lagos@nrcedu-uk.com", openingHours: "Mon to Fri, 9am to 5pm", isHeadOffice: false },
];

const demoPartnerNames = partners;
const demoTestimonialNames = testimonials.map((t) => t.name);
const demoSlideTitles = slides.map((s) => s.title);

async function remove() {
  await db.heroSlide.deleteMany({ where: { title: { in: demoSlideTitles } } });
  await db.university.deleteMany({ where: { slug: { in: universities.map((u) => u.slug) } } });
  await db.subject.deleteMany({ where: { slug: { in: subjects.map((s) => s.slug) } } });
  await db.testimonial.deleteMany({ where: { name: { in: demoTestimonialNames } } });
  await db.partner.deleteMany({ where: { name: { in: demoPartnerNames } } });
  await db.faq.deleteMany({ where: { question: { in: faqs.map((f) => f.question) } } });
  await db.blogPost.deleteMany({ where: { slug: { in: posts.map((p) => p.slug) } } });
  await db.testPrepPage.deleteMany({ where: { slug: { in: testPrep.map((t) => t.slug) } } });
  await db.office.deleteMany({ where: { name: { in: offices.map((o) => o.name) } } });
  console.log("Demo content removed.");
}

async function seed() {
  for (const [index, slide] of slides.entries()) {
    const existing = await db.heroSlide.findFirst({ where: { title: slide.title } });
    if (!existing) await db.heroSlide.create({ data: { ...slide, sortOrder: index } });
  }

  for (const [slug, description] of Object.entries(countryDescriptions)) {
    await db.country.update({
      where: { slug },
      data: { description, imageUrl: photo(`country-${slug}`, 800, 600) },
    });
  }

  for (const subject of subjects) {
    await db.subject.upsert({ where: { slug: subject.slug }, update: {}, create: subject });
  }

  for (const uni of universities) {
    const country = await db.country.findUniqueOrThrow({ where: { slug: uni.country } });
    const university = await db.university.upsert({
      where: { slug: uni.slug },
      update: {},
      create: {
        name: uni.name,
        slug: uni.slug,
        countryId: country.id,
        city: uni.city,
        ranking: uni.ranking,
        coverUrl: photo(`uni-${uni.slug}`, 800, 600),
        description: `${uni.name} is a sample university used while the website is being built.`,
        isOfficialPartner: uni.partner,
        isFeatured: true,
        isPublished: true,
        nrcCommissionRate: 15,
        agentCommissionRate: 8,
      },
    });

    for (const course of courseTemplates) {
      const subject = await db.subject.findUniqueOrThrow({ where: { slug: course.subject } });
      await db.course.upsert({
        where: { universityId_slug: { universityId: university.id, slug: course.slug } },
        update: {},
        create: {
          universityId: university.id,
          subjectId: subject.id,
          name: course.name,
          slug: course.slug,
          level: course.level,
          durationMonths: course.months,
          tuitionFee: course.fee,
          isPublished: true,
        },
      });
    }

    if ((await db.intake.count({ where: { universityId: university.id } })) === 0) {
      await db.intake.createMany({
        data: [
          { universityId: university.id, name: "January 2027", startDate: new Date("2027-01-18"), applicationDeadline: new Date("2026-11-30") },
          { universityId: university.id, name: "September 2027", startDate: new Date("2027-09-20"), applicationDeadline: new Date("2027-06-30") },
        ],
      });
    }
  }

  for (const [index, testimonial] of testimonials.entries()) {
    const existing = await db.testimonial.findFirst({ where: { name: testimonial.name } });
    if (!existing) {
      await db.testimonial.create({ data: { ...testimonial, sortOrder: index, isPublished: true } });
    }
  }

  for (const [index, name] of partners.entries()) {
    const existing = await db.partner.findFirst({ where: { name } });
    if (!existing) await db.partner.create({ data: { name, sortOrder: index } });
  }

  for (const [index, faq] of faqs.entries()) {
    const existing = await db.faq.findFirst({ where: { question: faq.question } });
    if (!existing) await db.faq.create({ data: { ...faq, sortOrder: index } });
  }

  for (const [index, post] of posts.entries()) {
    await db.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        content: `${post.excerpt}\n\nThis is sample text. The real article will be written in the admin panel.`,
        coverUrl: photo(`post-${post.slug}`, 800, 500),
        status: "PUBLISHED",
        publishedAt: new Date(Date.UTC(2026, 9, 10 - index * 7)),
      },
    });
  }

  for (const [index, test] of testPrep.entries()) {
    await db.testPrepPage.upsert({
      where: { slug: test.slug },
      update: {},
      create: { ...test, sortOrder: index, isPublished: true },
    });
  }

  for (const [index, office] of offices.entries()) {
    const existing = await db.office.findFirst({ where: { name: office.name } });
    if (!existing) {
      await db.office.create({ data: { ...office, sortOrder: index, imageUrl: photo(`office-${index}`, 800, 500) } });
    }
  }

  console.log(
    `Demo content ready: ${offices.length} offices, ${slides.length} slides, ${universities.length} universities, ` +
      `${universities.length * courseTemplates.length} courses, ${testimonials.length} testimonials, ` +
      `${partners.length} partners, ${faqs.length} FAQs, ${posts.length} posts, ${testPrep.length} test prep pages.`,
  );
}

(process.argv.includes("--remove") ? remove() : seed())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
