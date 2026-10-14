import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { universityCard } from "@/lib/data/catalogue";
import { db } from "@/lib/db";

// Public content for the home page. Each read is cached and tagged; admin actions call
// updateTag() with the same tag so edits show up straight away. Select only public fields:
// commission rates and other internal columns must never be returned from here.

export async function getHeroSlides() {
  "use cache";
  cacheTag("hero-slides");
  cacheLife("hours");

  return db.heroSlide.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, subtitle: true, imageUrl: true, buttonLabel: true, buttonHref: true },
  });
}

export async function getDestinations() {
  "use cache";
  cacheTag("countries");
  cacheLife("hours");

  return db.country.findMany({
    where: { isDestination: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      _count: { select: { universities: { where: { isPublished: true } } } },
    },
  });
}

export async function getFeaturedUniversities() {
  "use cache";
  cacheTag("universities");
  cacheLife("hours");

  return db.university.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ ranking: "asc" }, { name: "asc" }],
    take: 6,
    select: universityCard,
  });
}

export async function getTestimonials() {
  "use cache";
  cacheTag("testimonials");
  cacheLife("hours");

  return db.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
    select: { id: true, name: true, headline: true, quote: true, rating: true },
  });
}

export async function getPartners() {
  "use cache";
  cacheTag("partners");
  cacheLife("hours");

  return db.partner.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, logoUrl: true },
  });
}

export async function getLatestPosts() {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  return db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true },
  });
}

export async function getFaqs() {
  "use cache";
  cacheTag("faqs");
  cacheLife("hours");

  return db.faq.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    take: 8,
    select: { id: true, question: true, answer: true },
  });
}

export async function getOffices() {
  "use cache";
  cacheTag("offices");
  cacheLife("hours");

  return db.office.findMany({
    where: { isPublished: true },
    orderBy: [{ isHeadOffice: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      address: true,
      phone: true,
      email: true,
      openingHours: true,
      mapUrl: true,
      imageUrl: true,
      isHeadOffice: true,
    },
  });
}

export async function getTestPrepPages() {
  "use cache";
  cacheTag("test-prep");
  cacheLife("hours");

  return db.testPrepPage.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, summary: true },
  });
}
