import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Container, Section, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = { title: "Style guide", robots: { index: false } };

const swatches = [
  ["Brand 600", "bg-brand-600"],
  ["Brand 400", "bg-brand-400"],
  ["Deep 600", "bg-deep-600"],
  ["Deep 900", "bg-deep-900"],
  ["Accent 500", "bg-accent-500"],
  ["Surface", "bg-surface"],
];

export default function StyleGuide() {
  return (
    <main>
      <header className="sticky top-4 z-10 mt-4">
        <Container>
          <div className="glass flex items-center justify-between rounded-full py-2 pl-3 pr-2">
            <div className="flex items-center gap-3">
              <Image src="/nrc-logo.png" alt="NRC" width={50} height={40} priority />
              <span className="font-display font-bold text-brand-800">
                NRC Educational Consultants
              </span>
            </div>
            <Button variant="accent" size="sm">
              Free consultation
            </Button>
          </div>
        </Container>
      </header>

      <Section tone="deep" className="mt-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge className="border-white/25 bg-white/15 text-white">200+ universities</Badge>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Your pathway to global education
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/80">
              Sample hero on the dark backdrop, with glass panels on top.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="accent" size="lg">
                Apply now
              </Button>
              <Button variant="glass" size="lg" className="glass-dark text-white hover:bg-white/20">
                Browse universities
              </Button>
            </div>
          </div>
          <Card tone="dark">
            <h3 className="text-xl font-bold">Dark glass card</h3>
            <p className="mt-2 text-white/80">Used inside hero, footer and the dashboard sidebar.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {["30+ countries", "4+ years", "1,000+ students"].map((stat) => (
                <div key={stat} className="glass-dark rounded-2xl px-2 py-4 text-sm font-semibold">
                  {stat}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Design system" title="Glass surfaces">
          Three levels of glass, chosen by how much text sits on the surface.
        </SectionHeading>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-bold">Light glass</h3>
            <p className="mt-2 text-muted">Cards, header and marketing sections.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Offer received</Badge>
              <Badge tone="accent">Documents pending</Badge>
              <Badge tone="success">Visa granted</Badge>
              <Badge tone="danger">Refused</Badge>
              <Badge tone="neutral">New</Badge>
            </div>
          </Card>
          <Card tone="solid">
            <h3 className="text-lg font-bold">Solid glass</h3>
            <p className="mt-2 text-muted">Tables and long forms in the admin panel and CRM.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="accent">
                Accent
              </Button>
              <Button size="sm" variant="glass">
                Glass
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Colours</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {swatches.map(([name, bg]) => (
                <div key={name} className="text-center text-xs text-muted">
                  <div className={`${bg} mb-1 h-12 rounded-xl border border-white/70`} />
                  {name}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="mx-auto mt-10 max-w-xl">
          <h3 className="text-lg font-bold">Form on glass</h3>
          <form className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="country">Preferred country</Label>
              <Select id="country" defaultValue="">
                <option value="" disabled>
                  Choose a country
                </option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Tell us about your plans" />
            </div>
            <Button type="button" variant="accent">
              Request consultation
            </Button>
          </form>
        </Card>
      </Section>
    </main>
  );
}
