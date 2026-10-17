import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "@/components/site/hero-slider";
import { Offices } from "@/components/site/offices";
import { SocialIcons } from "@/components/site/social-icons";
import { UniversityCard } from "@/components/site/university-card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { ScrollRow } from "@/components/ui/scroll-row";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import {
  getDestinations,
  getFaqs,
  getFeaturedUniversities,
  getHeroSlides,
  getLatestPosts,
  getPartners,
  getTestimonials,
} from "@/lib/data/home";
import { getSiteSettings, socialNetworks } from "@/lib/settings";

type Feature = { title: string; text: string; icon: IconName; color: TileColor };

// Figures from the old site; becomes editable in site settings (task 3.5).
const stats: { value: string; label: string; icon: IconName; color: TileColor }[] = [
  { value: "200+", label: "Partner universities", icon: "building", color: "sky" },
  { value: "30+", label: "Countries", icon: "globe", color: "violet" },
  { value: "4+", label: "Years of experience", icon: "clock", color: "emerald" },
  { value: "Free", label: "First consultation", icon: "check", color: "amber" },
];

const services: Feature[] = [
  { title: "Expert consultation", text: "We compare countries, courses and costs with you, and check which universities you are eligible for.", icon: "chat", color: "sky" },
  { title: "Application support", text: "Statements of purpose, recommendation letters and transcripts, reviewed before anything is submitted.", icon: "document", color: "amber" },
  { title: "Visa guidance", text: "A complete visa file, financial document checks and practice interviews.", icon: "shield", color: "emerald" },
  { title: "Pre-departure help", text: "Advice on flights, accommodation and what to expect in your first weeks.", icon: "send", color: "violet" },
];

const steps: Feature[] = [
  { title: "Talk to a counsellor", text: "Tell us your goals, grades and budget in a free consultation.", icon: "chat", color: "sky" },
  { title: "Choose your course", text: "We shortlist universities and courses that fit your profile.", icon: "search", color: "violet" },
  { title: "Apply with us", text: "Upload your documents once and track every application online.", icon: "document", color: "amber" },
  { title: "Get your visa and fly", text: "We prepare your visa application and help you get ready to travel.", icon: "send", color: "emerald" },
];

// Colour laid over photos, so cards stay on-brand whatever picture is behind them.
const photoTints = [
  "from-brand-700/90 via-brand-600/35",
  "from-indigo-700/90 via-violet-500/35",
  "from-teal-700/90 via-emerald-500/35",
  "from-orange-700/90 via-amber-500/35",
  "from-sky-700/90 via-cyan-500/35",
];

const avatarColors = [
  "from-sky-400 to-brand-600",
  "from-accent-400 to-orange-500",
  "from-violet-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
];

const cardHover = "transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-600/25";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function Home() {
  return (
    <main>
      <Hero />
      <Destinations />
      <FeaturedUniversities />
      <Services />
      <HowItWorks />
      <Testimonials />
      <Partners />
      <LatestPosts />
      <Offices className="pt-0 sm:pt-4" />
      <Faqs />
    </main>
  );
}

async function Hero() {
  const [slides, { social }] = await Promise.all([getHeroSlides(), getSiteSettings()]);

  return (
    <Container className="pt-6">
      {slides.length > 0 ? (
        <HeroSlider
          slides={slides}
          socials={<SocialIcons social={social} networks={socialNetworks} tone="dark" size="md" className="gap-2.5" />}
        />
      ) : (
        // Shown if every slide is unpublished, so the page never loses its main heading.
        <section className="bg-vivid rounded-[2rem] p-8 text-white sm:p-14">
          <h1 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your pathway to <span className="text-gradient-warm">global education</span>
          </h1>
          <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "lg", className: "mt-7" })}>
            Book a free consultation
          </Link>
        </section>
      )}

      <dl className="glass relative z-10 mx-2 -mt-10 grid grid-cols-2 gap-6 rounded-3xl p-6 sm:mx-10 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4">
            <IconTile name={stat.icon} color={stat.color} className="shrink-0" />
            <div className="flex flex-col">
              <dt className="order-2 text-sm text-muted">{stat.label}</dt>
              <dd className="text-gradient font-display text-3xl font-extrabold">{stat.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Container>
  );
}

async function Destinations() {
  const countries = await getDestinations();
  if (countries.length === 0) return null;

  return (
    <Section tint="sky">
      <SectionHeading eyebrow="Study destinations" title="Where would you like to" highlight="study?">
        Compare countries by cost, work rights and the universities we work with.
      </SectionHeading>
      {/* All countries side by side on desktop; a swipe row on phones and tablets. */}
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {countries.map((country, index) => (
          <li key={country.id} className="w-64 shrink-0 snap-start lg:w-auto">
            <Link
              href={`/destinations/${country.slug}`}
              className={`group bg-deep relative flex h-96 flex-col justify-end overflow-hidden rounded-3xl text-white shadow-xl shadow-brand-900/20 ${cardHover}`}
            >
              {country.imageUrl && (
                <Image
                  src={country.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 215px, 256px"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              )}
              <div className={`absolute inset-0 bg-linear-to-t to-transparent ${photoTints[index % photoTints.length]}`} />
              <div className="relative p-5">
                {country._count.universities > 0 && (
                  <span className="glass-dark inline-block rounded-full px-3 py-1 text-xs font-semibold">
                    {country._count.universities} {country._count.universities === 1 ? "university" : "universities"}
                  </span>
                )}
                <h3 className="mt-3 text-xl font-bold">{country.name}</h3>
                {country.description && <p className="mt-1 line-clamp-3 text-sm text-white/85">{country.description}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-400">
                  Explore <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

async function FeaturedUniversities() {
  const universities = await getFeaturedUniversities();
  if (universities.length === 0) return null;

  return (
    <Section tint="amber" className="pt-0 sm:pt-4">
      <SectionHeading eyebrow="Universities" title="Featured" highlight="universities">
        A selection of the universities our students apply to.
      </SectionHeading>
      <ScrollRow label="Featured universities">
        {universities.map((university) => (
          <li key={university.id} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
            <UniversityCard university={university} />
          </li>
        ))}
      </ScrollRow>
      <div className="mt-8 text-center">
        <Link href="/universities" className={buttonStyles()}>
          See all universities
        </Link>
      </div>
    </Section>
  );
}

function Services() {
  return (
    <Section tone="vivid">
      <SectionHeading onDark eyebrow="What we do" title="Support at" highlight="every step">
        One team looks after you from your first question to your first day on campus.
      </SectionHeading>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <li key={service.title}>
            <Card tone="dark" className="h-full transition duration-300 hover:-translate-y-1.5 hover:bg-white/15">
              <IconTile name={service.icon} color={service.color} />
              <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
              <p className="mt-2 text-sm text-white/80">{service.text}</p>
            </Card>
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center">
        <Link href="/services" className={buttonStyles({ variant: "accent" })}>
          All services
        </Link>
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section tint="violet">
      <SectionHeading eyebrow="How it works" title="Four steps to" highlight="your university" />
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card className={`relative h-full overflow-hidden ${cardHover}`}>
              <span aria-hidden="true" className="text-gradient absolute -right-1 -top-4 font-display text-8xl font-extrabold opacity-25">
                {index + 1}
              </span>
              <IconTile name={step.icon} color={step.color} />
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-brand-600">Step {index + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

async function Testimonials() {
  const testimonials = await getTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <Section tint="amber">
      <SectionHeading eyebrow="Student stories" title="What our" highlight="students say" />
      <ul className="grid gap-6 md:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <li key={testimonial.id}>
            <Card className={`h-full ${cardHover}`}>
              <figure className="flex h-full flex-col">
                {testimonial.rating && (
                  <p className="text-lg text-accent-500" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {"★".repeat(testimonial.rating)}
                    <span className="text-brand-900/15">{"★".repeat(5 - testimonial.rating)}</span>
                  </p>
                )}
                <blockquote className="mt-3 text-lg text-ink/90">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-6">
                  <span
                    aria-hidden="true"
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br font-display font-bold text-white ${avatarColors[index % avatarColors.length]}`}
                  >
                    {testimonial.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold">{testimonial.name}</span>
                    {testimonial.headline && <span className="block text-sm text-muted">{testimonial.headline}</span>}
                  </span>
                </figcaption>
              </figure>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

async function Partners() {
  const partners = await getPartners();
  if (partners.length === 0) return null;

  return (
    <Section tint="sky" className="pt-0 sm:pt-4">
      <SectionHeading eyebrow="Partners" title="Look who we're" highlight="partnered with" />
      <ul className="flex flex-wrap justify-center gap-4">
        {partners.map((partner) => (
          <li
            key={partner.id}
            className="glass flex h-16 items-center rounded-2xl px-6 font-display font-semibold text-brand-800 transition hover:-translate-y-1 hover:bg-white/80"
          >
            {partner.logoUrl ? (
              <Image src={partner.logoUrl} alt={partner.name} width={120} height={40} className="h-10 w-auto object-contain" />
            ) : (
              partner.name
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

async function LatestPosts() {
  const posts = await getLatestPosts();
  if (posts.length === 0) return null;

  return (
    <Section tint="amber" className="pt-0 sm:pt-4">
      <SectionHeading eyebrow="Blog" title="Advice for" highlight="studying abroad" />
      <ul className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block h-full">
              <Card className={`h-full overflow-hidden p-0 ${cardHover}`}>
                <div className="bg-deep relative h-44 overflow-hidden">
                  {post.coverUrl && (
                    <Image
                      src={post.coverUrl}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 352px, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
                <div className="p-6">
                  {post.publishedAt && (
                    <Badge tone="brand">
                      <time dateTime={post.publishedAt.toISOString()}>{dateFormat.format(post.publishedAt)}</time>
                    </Badge>
                  )}
                  <h3 className="mt-3 text-lg font-bold group-hover:text-brand-700">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 text-sm text-muted">{post.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    Read more <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center">
        <Link href="/blog" className={buttonStyles({ variant: "glass" })}>
          Read the blog
        </Link>
      </div>
    </Section>
  );
}

async function Faqs() {
  const faqs = await getFaqs();
  if (faqs.length === 0) return null;

  return (
    <Section tint="violet" className="pt-0 sm:pt-4">
      <SectionHeading eyebrow="FAQ" title="Common" highlight="questions" />
      <div className="mx-auto grid max-w-3xl gap-3">
        {faqs.map((faq) => (
          <details key={faq.id} className="glass group rounded-2xl px-6 py-4 open:bg-white/75">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-brand-600 text-xl leading-none text-white transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
