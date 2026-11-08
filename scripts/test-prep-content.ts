// Content for the nine test prep guides. Loaded by scripts/seed-test-prep.ts.
// Fees and formats change: check each official site before publishing new figures.
import type { ScoreTable, TestFact } from "../src/lib/test-prep";

export type TestPrepContent = {
  name: string;
  slug: string;
  summary: string;
  facts: TestFact[];
  tables: ScoreTable[];
  content: string;
};

const FEE_NOTE = "Approximate fees in late 2025 / 2026. Prices differ by country and change often, so always confirm on the official website before booking.";

export const testPrepContent: TestPrepContent[] = [
  // ───────────────────────────── IELTS ─────────────────────────────
  {
    name: "IELTS",
    slug: "ielts",
    summary:
      "The International English Language Testing System is the most widely accepted English test for study abroad, recognised by over 12,000 organisations including every UK, Australian, Canadian and Irish university.",
    facts: [
      { label: "Full name", value: "International English Language Testing System" },
      { label: "Run by", value: "British Council, IDP and Cambridge English" },
      { label: "Versions", value: "IELTS Academic, General Training, IELTS for UKVI" },
      { label: "Duration", value: "2 hours 45 minutes (+ Speaking, 11–14 min)" },
      { label: "Score", value: "Band 0–9, in half bands" },
      { label: "Fee", value: "About £195–£280 in the UK; US$ 220–270 in most countries" },
      { label: "Test type", value: "Paper or computer at a test centre; IELTS Online at home" },
      { label: "Results", value: "Computer: 1–2 days. Paper: about 13 days" },
      { label: "Valid for", value: "2 years" },
      { label: "Retake", value: "Any time; One Skill Retake available on computer test" },
      { label: "Best for", value: "UK, Australia, Canada, Ireland, New Zealand, Europe" },
      { label: "Official site", value: "ielts.org" },
    ],
    tables: [
      {
        title: "IELTS Academic test format",
        columns: ["Section", "Time", "Questions", "What you do"],
        rows: [
          ["Listening", "30 min (+10 min transfer on paper)", "40", "Four recordings: conversations and lectures. Answer as you listen."],
          ["Reading", "60 min", "40", "Three long academic texts from books, journals and newspapers."],
          ["Writing", "60 min", "2 tasks", "Task 1: describe a graph, table or diagram (150 words). Task 2: essay (250 words)."],
          ["Speaking", "11–14 min", "3 parts", "Face-to-face interview with an examiner: introduction, short talk, discussion."],
        ],
        note: "Listening, Reading and Writing are taken on the same day with no breaks. Speaking can be the same day or up to a week before or after.",
      },
      {
        title: "What each band means",
        columns: ["Band", "Level", "CEFR", "Typically accepted for"],
        rows: [
          ["9", "Expert user", "C2", "Any course"],
          ["8–8.5", "Very good user", "C2/C1", "Law, medicine, top universities"],
          ["7–7.5", "Good user", "C1", "Competitive postgraduate courses, nursing, teaching"],
          ["6.5", "Competent user", "B2/C1", "Most master's courses"],
          ["6.0", "Competent user", "B2", "Most bachelor's courses"],
          ["5.5", "Modest user", "B2/B1", "Pre-sessional English or foundation routes"],
          ["4.0–5.0", "Limited user", "B1", "Foundation year with English support"],
        ],
      },
      {
        title: "Scores universities usually ask for",
        columns: ["Country", "Bachelor's", "Master's", "Visa minimum"],
        rows: [
          ["United Kingdom", "6.0 (no band below 5.5)", "6.5 (no band below 6.0)", "UKVI: 5.5 each band for degree level (if university sets no higher)"],
          ["Australia", "6.0–6.5", "6.5", "Student visa: 6.0 overall (5.5 with ELICOS)"],
          ["Canada", "6.5 (no band below 6.0)", "6.5–7.0", "SDS route: 6.0 in each band"],
          ["Ireland", "6.0–6.5", "6.5", "Set by the university"],
          ["USA", "6.5", "7.0", "Set by the university"],
          ["Europe (English-taught)", "6.0–6.5", "6.5", "Set by the university"],
        ],
        note: "Top-ranked universities, medicine, law and teaching often ask for 7.0 or higher.",
      },
      {
        title: "Approximate IELTS fees",
        columns: ["Country", "IELTS Academic", "IELTS for UKVI"],
        rows: [
          ["United Kingdom", "£195–£230", "£220–£280"],
          ["Bangladesh", "BDT 26,000–29,000", "BDT 28,000–32,000"],
          ["Nigeria", "about NGN 290,000–330,000", "about NGN 300,000–350,000"],
          ["India", "INR 17,000–18,000", "INR 17,500–18,500"],
          ["Pakistan", "PKR 60,000–75,000", "PKR 62,000–78,000"],
          ["USA / Canada", "US$ 245–255 / CA$ 330–345", "—"],
        ],
        note: FEE_NOTE,
      },
    ],
    content: `## What is IELTS?

IELTS (International English Language Testing System) checks how well you read, write, listen and speak in English. Universities use it to make sure you can follow lectures, write essays and take part in seminars. It is accepted by more than 12,000 universities, employers and governments, including every university in the UK, Australia, Canada, Ireland and New Zealand.

## Which IELTS do I need?

- **IELTS Academic**: for university study (bachelor's, master's, PhD). This is the one most of our students take.
- **IELTS for UKVI (Academic)**: the same test, taken at a Home Office–approved centre. You need this if you are studying **below degree level** in the UK (foundation, pre-sessional English), or if your university asks for a "SELT" (Secure English Language Test).
- **IELTS General Training**: for work and migration, not usually for university.
- **IELTS Life Skills**: only speaking and listening, for some family visas. Not for students.

If you are going straight onto a UK degree at a licensed university, normal IELTS Academic is usually enough. Check with us before booking, because booking the wrong version is a common and expensive mistake.

## How is it scored?

Each of the four skills gets a band from 0 to 9. Your **overall band** is the average of the four, rounded to the nearest half band. For example, Listening 6.5 + Reading 6.0 + Writing 5.5 + Speaking 7.0 = 25 ÷ 4 = 6.25, which rounds up to **6.5 overall**.

Universities nearly always set an overall score *and* a minimum for each skill, such as "6.5 overall with no band below 6.0". Writing is usually the lowest band for most students, so plan extra practice for it.

## Paper, computer or online?

- **Computer-delivered** at a test centre: more test dates (often daily), results in 1–2 days, and you can use **One Skill Retake** if one band lets you down.
- **Paper-based** at a test centre: some students prefer writing by hand. Results in about 13 days.
- **IELTS Online** at home: same test, taken on your own computer with a live proctor. Not accepted for UK visas, and not every university accepts it.

The Speaking test is always with a live examiner, whichever version you choose.

## How to book

1. Check the exact score and version your universities ask for.
2. Book on the British Council or IDP website (or through us). Book **4–6 weeks ahead**, as dates fill up in peak months (May–August).
3. Use the same passport you will use for your visa application. Your name must match exactly.
4. On test day bring the original passport. Arrive at least 30 minutes early.

## How long should I prepare?

| Your current level | Target 6.0 | Target 6.5 | Target 7.0+ |
|---|---|---|---|
| Good English (studied in English) | 2–3 weeks | 3–4 weeks | 4–6 weeks |
| Intermediate | 4–6 weeks | 6–8 weeks | 8–12 weeks |
| Basic | 8–12 weeks | 3–4 months | 4–6 months |

## Preparation tips

- **Listening**: practise with British, Australian and North American accents. Spelling counts, so a wrong spelling is a wrong answer.
- **Reading**: don't read every word. Skim for the main idea, then scan for keywords. Learn the difference between *False* and *Not Given*.
- **Writing**: Task 2 is worth twice as much as Task 1. Always write at least 250 words and keep 5 minutes to check. Learn a clear structure: introduction, two body paragraphs, conclusion.
- **Speaking**: answer in full sentences and give reasons and examples. Fluency matters more than perfect grammar. Don't memorise answers, because examiners notice.
- Take at least **three full timed mock tests** before the real exam.

## Common questions

**How many times can I take IELTS?** As many times as you like. There is no waiting period.

**Can I use an old score?** Only if it is under 2 years old on the date your course starts (some universities count to the application date).

**Can I get a re-mark?** Yes. An Enquiry on Results costs about the same as half a test fee and is refunded if your band goes up.

**Do I need IELTS if I studied in English?** Sometimes not. Many UK universities accept English-medium education or a strong English grade at school (e.g. GCSE/O-level C or WAEC/NECO credit). Ask us to check before you pay for a test.`,
  },

  // ───────────────────────────── TOEFL ─────────────────────────────
  {
    name: "TOEFL iBT",
    slug: "toefl",
    summary:
      "The Test of English as a Foreign Language, run by ETS, is the English test most US universities know best. It is also accepted across Canada, Europe, the UK and Australia.",
    facts: [
      { label: "Full name", value: "Test of English as a Foreign Language (internet-based)" },
      { label: "Run by", value: "ETS (Educational Testing Service)" },
      { label: "Duration", value: "About 1.5 to 2 hours" },
      { label: "Score", value: "1–6 band scale (from 2026), still shown alongside 0–120 until 2028" },
      { label: "Fee", value: "About US$ 195–270 depending on country" },
      { label: "Test type", value: "Computer at a test centre, or Home Edition online" },
      { label: "Results", value: "Usually within 72 hours" },
      { label: "Valid for", value: "2 years" },
      { label: "Retake", value: "As often as you like, but only once in any 3-day period" },
      { label: "Free score reports", value: "Up to 4 universities if chosen before the test" },
      { label: "Best for", value: "USA, Canada, Europe; accepted widely elsewhere" },
      { label: "Official site", value: "ets.org/toefl" },
    ],
    tables: [
      {
        title: "TOEFL iBT test format (from January 2026)",
        columns: ["Section", "Approx. time", "What you do"],
        rows: [
          ["Reading", "about 18–27 min", "Short and academic texts, everyday reading (emails, notices) and complete-the-words tasks. Adaptive: the second part depends on how you do in the first."],
          ["Listening", "about 18–27 min", "Conversations, announcements and short academic talks. Also adaptive."],
          ["Writing", "about 23 min", "Build a sentence, write an email and take part in an academic discussion post."],
          ["Speaking", "about 8 min", "Listen and repeat, then a short simulated interview. Recorded and scored by AI and human raters."],
        ],
        note: "ETS updated the test in January 2026. Older guides describing a 3-hour test or the 0–120 scale alone are out of date.",
      },
      {
        title: "How the new 1–6 scale compares",
        columns: ["New band (1–6)", "Old total (0–120)", "CEFR", "Rough IELTS"],
        rows: [
          ["6.0", "114–120", "C2", "8.5–9.0"],
          ["5.5", "107–113", "C1/C2", "8.0"],
          ["5.0", "95–106", "C1", "7.0–7.5"],
          ["4.5", "86–94", "B2/C1", "6.5"],
          ["4.0", "72–85", "B2", "6.0"],
          ["3.5", "58–71", "B1/B2", "5.5"],
          ["3.0", "42–57", "B1", "5.0"],
        ],
        note: "Approximate comparison published during the 2026 transition. Universities may still state requirements on the old 0–120 scale.",
      },
      {
        title: "Scores universities usually ask for",
        columns: ["University type", "Old scale (0–120)", "New scale (1–6)"],
        rows: [
          ["Top US universities (Ivy League, MIT, Stanford)", "100–110+", "5.0–5.5"],
          ["Strong US / Canadian universities", "90–100", "4.5–5.0"],
          ["Most US state universities", "79–90", "4.0–4.5"],
          ["UK master's", "88–100", "4.5–5.0"],
          ["Community colleges / pathway programmes", "61–79", "3.5–4.0"],
        ],
      },
      {
        title: "Approximate TOEFL iBT fees",
        columns: ["Country", "Fee"],
        rows: [
          ["USA", "about US$ 250–270"],
          ["United Kingdom", "about US$ 260"],
          ["Bangladesh", "about US$ 225"],
          ["Nigeria", "about US$ 225"],
          ["India", "about INR 16,900"],
          ["Extra score reports (after the test)", "about US$ 25 each"],
          ["Rescheduling", "about US$ 60"],
        ],
        note: FEE_NOTE,
      },
    ],
    content: `## What is TOEFL?

TOEFL iBT is an English test made by ETS, the same organisation that runs the GRE. It tests reading, listening, speaking and writing, all on computer. It is the test American universities know best, and it is accepted by more than 12,000 institutions in over 160 countries, including most UK, Canadian, Australian and European universities.

## What changed in 2026?

From **21 January 2026** ETS launched a shorter, updated TOEFL iBT:

- The test is now about **1.5–2 hours** instead of nearly 3.
- Reading and Listening are **adaptive**: the questions get harder or easier depending on your answers.
- Tasks are more everyday and practical (emails, announcements, short discussions) as well as academic.
- Scores are on a new **1–6 band scale** matched to CEFR levels. Until 2028 your report also shows the familiar 0–120 equivalent, so universities with old requirements can still read it.

## TOEFL or IELTS?

Choose **TOEFL** if you are applying mainly to the USA, you are comfortable typing, and you prefer everything on a computer, including speaking into a microphone.

Choose **IELTS** if you are applying to the UK or Australia, need a UKVI test for a visa, or prefer speaking to a real person.

Both are accepted by most universities, so pick the one you will score higher on. Do one free practice test of each if you are unsure.

## TOEFL Home Edition

You can take the same test at home on your own computer with a live online proctor. You need a quiet private room, a webcam, a desk clear of everything, and a reliable internet connection. Most US universities accept it. **It is not accepted for UK student visas.**

## MyBest scores

TOEFL score reports show your **MyBest score**: your best section scores from all tests in the last 2 years combined. Many US universities accept MyBest, which means a weak section in one sitting can be replaced by a better one later.

## How to book

1. Create an ETS account at ets.org/toefl, using your name exactly as it appears in your passport.
2. Choose test centre or Home Edition and a date. Book **at least 4 weeks ahead**.
3. Before the test, choose up to **4 universities** to receive your score free. After the test, each report costs about US$ 25.

## Preparation tips

- Practise **typing** in English. The writing tasks are timed and typed.
- For Speaking, practise answering into a microphone with a timer running. Short, clear, well-organised answers score best.
- Use the official ETS practice tests: they are the only ones that reflect the 2026 format accurately.
- Build academic vocabulary daily: 15–20 new words a day for 6 weeks makes a noticeable difference.

## Common questions

**How soon can I retake?** You can test again after 3 days, with no limit on attempts.

**Do UK universities accept TOEFL?** Most do for admission. For a UK student visa below degree level you need a UKVI-approved SELT, which TOEFL iBT is not in most cases, so take IELTS for UKVI, PTE Academic UKVI or LanguageCert instead.`,
  },

  // ───────────────────────────── PTE ─────────────────────────────
  {
    name: "PTE Academic",
    slug: "pte",
    summary:
      "Pearson Test of English Academic is a fully computer-based test scored by AI, with results usually within 48 hours. It is accepted for UK and Australian visas and by most universities worldwide.",
    facts: [
      { label: "Full name", value: "Pearson Test of English Academic" },
      { label: "Run by", value: "Pearson" },
      { label: "Duration", value: "About 2 hours, one sitting" },
      { label: "Score", value: "10–90 overall and for each skill" },
      { label: "Fee", value: "About £190–£220 in the UK; US$ 200–250 elsewhere" },
      { label: "Test type", value: "Computer at a test centre; PTE Academic Online at home" },
      { label: "Results", value: "Usually within 48 hours (often same day)" },
      { label: "Valid for", value: "2 years" },
      { label: "Retake", value: "Book again after your result arrives" },
      { label: "Visa use", value: "PTE Academic UKVI for UK visas; accepted for Australian and NZ visas" },
      { label: "Best for", value: "Australia, UK, New Zealand, Canada (SDS)" },
      { label: "Official site", value: "pearsonpte.com" },
    ],
    tables: [
      {
        title: "PTE Academic test format",
        columns: ["Part", "Time", "Question types"],
        rows: [
          ["Speaking & Writing", "54–67 min", "Personal introduction (unscored), read aloud, repeat sentence, describe image, re-tell lecture, answer short question, summarise written text, essay (200–300 words)"],
          ["Reading", "29–30 min", "Reading & writing fill in the blanks, multiple choice, re-order paragraphs, fill in the blanks"],
          ["Listening", "30–43 min", "Summarise spoken text, multiple choice, fill in the blanks, highlight correct summary, select missing word, highlight incorrect words, write from dictation"],
        ],
        note: "Many questions score more than one skill. For example, Read Aloud counts towards both Speaking and Reading.",
      },
      {
        title: "PTE score compared with IELTS",
        columns: ["PTE Academic", "IELTS", "CEFR"],
        rows: [
          ["86–90", "9.0", "C2"],
          ["83–85", "8.5", "C2"],
          ["79–82", "8.0", "C1"],
          ["73–78", "7.5", "C1"],
          ["65–72", "7.0", "C1"],
          ["58–64", "6.5", "B2"],
          ["50–57", "6.0", "B2"],
          ["42–49", "5.5", "B1"],
          ["36–41", "5.0", "B1"],
        ],
        note: "Based on Pearson's published concordance. Universities set their own PTE requirements, which do not always follow this table exactly.",
      },
      {
        title: "Approximate PTE Academic fees",
        columns: ["Country", "PTE Academic", "PTE Academic UKVI"],
        rows: [
          ["United Kingdom", "£190–£215", "£190–£215"],
          ["Australia", "AU$ 430–470", "—"],
          ["Bangladesh", "about BDT 25,000–28,000", "about BDT 25,000–28,000"],
          ["Nigeria", "about US$ 200–230 (paid locally)", "about US$ 200–230"],
          ["India", "about INR 17,000–18,000", "about INR 17,000–18,000"],
        ],
        note: FEE_NOTE,
      },
    ],
    content: `## What is PTE Academic?

PTE Academic is an English test made by Pearson. You take the whole test on a computer, in one sitting of about two hours, and it is scored by a computer system. Results usually arrive in 48 hours, often the same day. It is accepted by thousands of universities including almost all universities in Australia, the UK, New Zealand and Ireland, many in Canada and a growing number in the USA.

## Which version do I need?

- **PTE Academic**: for university admission and Australian/NZ visas.
- **PTE Academic UKVI**: same test at a Home Office–approved centre, needed for some UK visa routes (for example courses below degree level).
- **PTE Academic Online**: at home. Not accepted for visas, and accepted by fewer universities.
- **PTE Home** (A1/A2/B1) is for family and settlement visas, not for students.

## Why students choose PTE

- **Fast results**: ideal if a deadline is close.
- **No human examiner**: some students feel less nervous speaking to a microphone.
- **Lots of test dates**: often available within a few days.
- **Integrated scoring**: several tasks score two skills at once, so strong reading and listening can lift your writing score.

## How is it scored?

You get an overall score from 10 to 90, plus scores for Listening, Reading, Speaking and Writing. Universities usually ask for an overall score and a minimum in each skill, for example "58 overall with no less than 51 in each skill" (similar to IELTS 6.5 with 6.0 in each band).

## How to book

1. Create a Pearson account at pearsonpte.com with your passport details.
2. Choose PTE Academic or PTE Academic UKVI, then a centre and date.
3. You can usually book as little as 24–48 hours ahead, but book a week or more ahead to choose your time.
4. Bring your original passport. Your photo, palm vein scan and signature are taken at check-in.

## Preparation tips

- **Speaking**: fluency and pronunciation matter more than content. Speak at a steady pace, don't stop and restart, and start speaking quickly after the microphone opens (it closes after 3 seconds of silence).
- **Write from Dictation** and **Repeat Sentence** carry a lot of marks. Practise them daily.
- **Summarise Written Text**: one sentence, 5–75 words. Use correct grammar and punctuation.
- **Essay**: 200–300 words. Going over or under the limit loses marks.
- Use the official Pearson scored practice tests to see a realistic score before booking.

## Common questions

**Can I retake quickly?** Yes. You can book a new test as soon as your previous result is out.

**Does PTE expire?** Scores are valid for 2 years from the test date.

**Is PTE harder than IELTS?** Not harder, just different. Students who are confident with computers and typing often score higher in PTE.`,
  },

  // ───────────────────────────── DUOLINGO ─────────────────────────────
  {
    name: "Duolingo English Test",
    slug: "duolingo",
    summary:
      "The Duolingo English Test is a one-hour adaptive test you take online at home for about US$ 70. It is accepted by over 5,500 programmes, including many in the USA, Canada, UK and Europe.",
    facts: [
      { label: "Full name", value: "Duolingo English Test (DET)" },
      { label: "Run by", value: "Duolingo" },
      { label: "Duration", value: "About 1 hour" },
      { label: "Score", value: "10–160, in steps of 5" },
      { label: "Fee", value: "About US$ 70 (same everywhere)" },
      { label: "Test type", value: "Online at home, any day, any time" },
      { label: "Results", value: "Within 2 days" },
      { label: "Valid for", value: "2 years" },
      { label: "Retake", value: "Up to 3 times in any 30-day period" },
      { label: "Score sending", value: "Free and unlimited" },
      { label: "Visa use", value: "Not accepted for UK or Australian visas" },
      { label: "Official site", value: "englishtest.duolingo.com" },
    ],
    tables: [
      {
        title: "Duolingo English Test format",
        columns: ["Part", "Time", "What you do"],
        rows: [
          ["Introduction & setup", "about 5 min", "Check your camera, microphone and ID. Read the rules."],
          ["Adaptive test", "about 45 min", "Short, mixed tasks: read and complete, read and select real words, listen and type, read aloud, write about a photo, speak about a photo, interactive reading and listening, writing and speaking samples."],
          ["Writing & speaking sample", "about 10 min", "A longer written answer and a longer spoken answer. Not scored, but sent to universities with your result."],
        ],
        note: "The test is adaptive: each question is chosen based on how you answered the one before.",
      },
      {
        title: "Duolingo score compared with IELTS and TOEFL",
        columns: ["Duolingo", "IELTS", "TOEFL (0–120)", "CEFR"],
        rows: [
          ["155–160", "8.5–9.0", "118–120", "C2"],
          ["145–150", "8.0", "112–117", "C1/C2"],
          ["135–140", "7.0–7.5", "101–111", "C1"],
          ["120–130", "6.5", "86–100", "B2/C1"],
          ["105–115", "6.0", "72–85", "B2"],
          ["95–100", "5.5", "59–71", "B1/B2"],
          ["85–90", "5.0", "46–58", "B1"],
        ],
        note: "Approximate, from Duolingo's published comparison. Always check each university's own requirement.",
      },
      {
        title: "Where Duolingo is commonly accepted",
        columns: ["Country", "University admission", "Visa"],
        rows: [
          ["USA", "Widely accepted, including many top universities", "No separate visa test needed"],
          ["Canada", "Many universities and colleges", "Not accepted for SDS"],
          ["United Kingdom", "A growing number of universities", "Not a UKVI SELT"],
          ["Ireland / Europe", "Many universities", "Usually set by the university"],
          ["Australia", "A few universities", "Not accepted for student visa"],
        ],
      },
    ],
    content: `## What is the Duolingo English Test?

The Duolingo English Test (DET) is an online English test you take at home on your own computer. It takes about an hour, costs around **US$ 70**, and results come within 2 days. Because it is cheap and convenient, it has become popular for applications to the USA, Canada and Europe, and a growing number of UK universities accept it.

## Is it right for me?

**Good choice if:**
- Your universities list it as accepted (always check first).
- You are applying to the USA, Canada or Europe.
- You need a score quickly or cannot easily reach a test centre.
- You want the cheapest option, or plan to send scores to many universities (sending is free).

**Not the right choice if:**
- You need a test for a **UK** or **Australian visa** (it is not accepted).
- You are applying to a university or course that does not list it.

## What you need on test day

- A computer (not a phone or tablet) with a working webcam, microphone and speakers. Headphones are not allowed.
- A quiet, well-lit room where you are alone.
- Your passport or other accepted photo ID.
- A stable internet connection and the Duolingo English Test app installed.

Your test is recorded and checked by human proctors. Looking away from the screen, talking, or having anyone else in the room can get your result cancelled, so follow the rules carefully.

## How it is scored

You get an **overall score from 10 to 160** and four subscores: *Literacy, Comprehension, Conversation* and *Production*. Most universities ask for an overall score (often 105–125) and sometimes a minimum subscore.

## Preparation tips

- Take the **free practice test** on the Duolingo site several times. It has the same question types.
- "Read and select" asks you to spot real English words among made-up ones, so building vocabulary pays off.
- For speaking and writing tasks, keep talking or writing for the full time. Length and variety help your score.
- Check your equipment the day before using the app's system check.

## Common questions

**How often can I take it?** Up to 3 times in any 30-day period.

**Do universities see the video?** They see your unscored writing and speaking samples, not the full recording.

**Is the Duolingo app enough to prepare?** No. The language-learning app is different from the test. Use the official test practice and preparation materials.`,
  },

  // ───────────────────────────── GRE ─────────────────────────────
  {
    name: "GRE",
    slug: "gre",
    summary:
      "The GRE General Test is a postgraduate admissions test of verbal reasoning, maths and analytical writing. It is often required for master's and PhD courses in the USA and accepted by many business schools.",
    facts: [
      { label: "Full name", value: "Graduate Record Examinations General Test" },
      { label: "Run by", value: "ETS (Educational Testing Service)" },
      { label: "Duration", value: "1 hour 58 minutes (no scheduled break)" },
      { label: "Score", value: "Verbal 130–170, Quant 130–170, Writing 0–6" },
      { label: "Fee", value: "About US$ 220 (US$ 228 in India, about US$ 205 in some countries)" },
      { label: "Test type", value: "Computer at a test centre, or at home" },
      { label: "Results", value: "Unofficial Verbal and Quant at the end; official in 8–10 days" },
      { label: "Valid for", value: "5 years" },
      { label: "Retake", value: "Every 21 days, up to 5 times in 12 months" },
      { label: "ScoreSelect", value: "Choose which test scores universities see" },
      { label: "Best for", value: "US master's and PhD; STEM, social sciences, some MBAs" },
      { label: "Official site", value: "ets.org/gre" },
    ],
    tables: [
      {
        title: "GRE General Test format",
        columns: ["Section", "Questions", "Time", "What it tests"],
        rows: [
          ["Analytical Writing", "1 essay", "30 min", "'Analyze an Issue': give and support your view on a statement"],
          ["Verbal Reasoning (section 1)", "12", "18 min", "Reading comprehension, text completion, sentence equivalence"],
          ["Verbal Reasoning (section 2)", "15", "23 min", "Same types; difficulty depends on section 1"],
          ["Quantitative Reasoning (section 1)", "12", "21 min", "Arithmetic, algebra, geometry, data analysis (high-school level)"],
          ["Quantitative Reasoning (section 2)", "15", "26 min", "Same types; difficulty depends on section 1"],
        ],
        note: "The essay always comes first. Verbal and Quant are section-adaptive. An on-screen calculator is provided for Quant.",
      },
      {
        title: "Typical GRE scores by programme",
        columns: ["Programme level", "Verbal", "Quant", "Writing"],
        rows: [
          ["Top 10 US programmes (engineering / CS)", "155–165", "165–170", "4.0–4.5"],
          ["Top 50 US programmes", "152–160", "160–167", "3.5–4.5"],
          ["Good state universities", "148–155", "152–162", "3.5–4.0"],
          ["Humanities / social sciences (top)", "160–168", "153–160", "4.5–5.0"],
          ["MBA (where GRE accepted)", "155–162", "155–165", "4.0–4.5"],
        ],
        note: "Averages differ by course. Engineering and computer science weigh Quant heavily; humanities weigh Verbal and Writing.",
      },
      {
        title: "GRE fees and extra charges",
        columns: ["Item", "Approx. fee"],
        rows: [
          ["GRE General Test (most countries)", "US$ 220"],
          ["GRE General Test (India)", "US$ 228"],
          ["Rescheduling", "about US$ 55"],
          ["Changing test centre", "about US$ 50"],
          ["Score report after test (each)", "about US$ 35"],
          ["Score reports chosen on test day", "4 free"],
        ],
        note: FEE_NOTE,
      },
    ],
    content: `## What is the GRE?

The GRE General Test is an admissions test for postgraduate study. It shows universities how well you reason with words and numbers and how clearly you write. It is most often asked for by **US master's and PhD programmes**, and it is accepted by many business schools instead of the GMAT. Some universities in Canada, Europe and Australia also use it for competitive or scholarship applications.

UK universities rarely require the GRE, but a strong score can help for some funded PhDs and scholarships.

## Do I need the GRE?

Many US universities made the GRE optional after 2020. Check each programme:

- **Required**: you must submit a score.
- **Recommended / optional**: a good score strengthens your application, especially if your grades are average or your degree is from a less-known university.
- **Not considered**: don't take it for that programme.

For scholarships and assistantships (funding) in the USA, a strong GRE often still makes a real difference.

## The shorter GRE (since September 2023)

The test is now **under 2 hours**. There is only one essay ("Analyze an Issue"), fewer questions, and no unscored experimental section. If you see older guides describing a nearly 4-hour test, they are out of date.

## How scoring works

- **Verbal Reasoning**: 130–170, in 1-point steps.
- **Quantitative Reasoning**: 130–170, in 1-point steps.
- **Analytical Writing**: 0–6, in half-point steps.

The test is **section-adaptive**: if you do well in the first Verbal or Quant section, the second is harder and can earn you a higher score. There is no penalty for wrong answers, so never leave a question blank.

## At home or at a centre?

Both are the same test with the same score. At home you need a private room, a computer with webcam, a small whiteboard or a sheet of paper in a clear sheet protector, and a stable connection. Many students in Bangladesh and Nigeria prefer a test centre to avoid power and internet problems.

## How long should I prepare?

Most students need **6–12 weeks** of steady study (1–2 hours a day). Engineering students often find Quant easy and need more time on Verbal vocabulary and reading. Humanities students often need more Quant practice.

## Preparation tips

- Start with the free **POWERPREP** practice test from ETS to get a baseline score.
- **Verbal**: learn vocabulary in context, not from word lists alone. Read quality articles (The Economist, Scientific American) daily.
- **Quant**: the maths is high-school level. The challenge is speed and tricky wording. Learn to estimate and check answer choices.
- **Writing**: practise timed Issue essays with a clear position, two or three strong examples and a short conclusion.
- Take full timed practice tests in the last 3–4 weeks.

## Common questions

**Can I hide a bad score?** Yes. With **ScoreSelect** you choose which test dates to send.

**How long is a score valid?** 5 years from your test date.

**GRE or GMAT for an MBA?** Most business schools accept both. Take the GMAT if you are certain about business school. Take the GRE if you are also applying to other master's programmes.`,
  },

  // ───────────────────────────── GMAT ─────────────────────────────
  {
    name: "GMAT",
    slug: "gmat",
    summary:
      "The GMAT Focus Edition is the standard admissions test for MBA and business master's courses worldwide, testing quantitative, verbal and data-analysis skills in 2 hours 15 minutes.",
    facts: [
      { label: "Full name", value: "Graduate Management Admission Test (Focus Edition)" },
      { label: "Run by", value: "GMAC (Graduate Management Admission Council)" },
      { label: "Duration", value: "2 hours 15 minutes (+ optional 10-min break)" },
      { label: "Score", value: "205–805 total; each section 60–90" },
      { label: "Fee", value: "About US$ 275 at a centre, US$ 300 online (varies by country)" },
      { label: "Test type", value: "Computer at a test centre, or online at home" },
      { label: "Results", value: "Unofficial at the end; official within 3–5 days" },
      { label: "Valid for", value: "5 years" },
      { label: "Retake", value: "Every 16 days, up to 5 times a year, 8 in total" },
      { label: "Score reports", value: "5 free; you choose which scores schools see" },
      { label: "Best for", value: "MBA, MSc Finance, MSc Management, Business Analytics" },
      { label: "Official site", value: "mba.com" },
    ],
    tables: [
      {
        title: "GMAT Focus Edition format",
        columns: ["Section", "Questions", "Time", "What it tests"],
        rows: [
          ["Quantitative Reasoning", "21", "45 min", "Arithmetic and algebra problem solving. No calculator. No geometry."],
          ["Verbal Reasoning", "23", "45 min", "Reading comprehension and critical reasoning (arguments)."],
          ["Data Insights", "20", "45 min", "Data sufficiency, multi-source reasoning, table analysis, graphics interpretation, two-part analysis. Calculator allowed."],
        ],
        note: "You choose the order of the sections. You can bookmark questions and change up to 3 answers per section.",
      },
      {
        title: "Typical GMAT Focus scores by school level",
        columns: ["School level", "Typical score", "Percentile (approx.)"],
        rows: [
          ["Top 10 global MBA (Harvard, Stanford, Wharton, INSEAD, LBS)", "675–735", "89–99"],
          ["Top 25 global MBA", "645–685", "80–92"],
          ["Top 50 / strong UK and European business schools", "595–655", "60–85"],
          ["Good regional MBA / business master's", "545–605", "40–65"],
        ],
        note: "A Focus Edition score of 645 is about the same as 700 on the old GMAT. Schools may still quote old-scale averages.",
      },
      {
        title: "GMAT fees and extra charges",
        columns: ["Item", "Approx. fee"],
        rows: [
          ["Test centre (USA)", "US$ 275"],
          ["Online exam (USA)", "US$ 300"],
          ["UK test centre", "about £225"],
          ["India test centre", "about US$ 275"],
          ["Rescheduling (more than 60 days ahead)", "about US$ 55"],
          ["Extra score report (each)", "about US$ 35"],
          ["Enhanced Score Report", "about US$ 30"],
        ],
        note: FEE_NOTE,
      },
    ],
    content: `## What is the GMAT?

The GMAT (Graduate Management Admission Test) is the admissions test used by business schools around the world. It shows schools how well you solve problems, reason with data and understand written arguments, the skills you need on an MBA or business master's. Over 7,700 programmes at around 2,400 universities use it, including all leading MBA programmes in the USA, UK, Europe, Canada and Asia.

## The GMAT Focus Edition

Since 2024 the only version is the **GMAT Focus Edition**. Compared with the old test it is shorter (2 hours 15 minutes), has no essay and no geometry, and adds a **Data Insights** section. Scores run from **205 to 805**, so they are not directly comparable to the old 200–800 scale. Use GMAC's official conversion if a school quotes old averages.

## Do I need the GMAT?

- **MBA**: most top schools require the GMAT or GRE. Some accept the Executive Assessment for executive MBAs, and some UK and European schools waive it for experienced applicants.
- **MSc Finance, Management, Business Analytics, Marketing**: often required at top schools in the UK and Europe, optional at others.
- **UK business master's for fresh graduates**: often not required, but a good score can win a scholarship.

## How scoring works

Each section is scored from **60 to 90** and they combine into a total of **205–805**. The test is **question-adaptive**: each answer affects the difficulty of the next question. Unanswered questions cost you a lot, so pace yourself to finish every section.

You see your unofficial score at the end and can decide which scores schools see. Schools only see the scores you choose to send.

## How long should I prepare?

Most successful candidates study for **8–12 weeks** and about **100–150 hours** in total. Plan for longer if your maths is rusty.

## Preparation tips

- Take the **free official practice exams** at mba.com to get a baseline.
- **Quant**: no calculator, so practise mental arithmetic, fractions, percentages and number properties.
- **Verbal**: critical reasoning is about finding the assumption in an argument. Practise identifying conclusions and evidence.
- **Data Insights**: learn the data-sufficiency method. You only need to decide *whether* the data is enough, not to solve it.
- Practise **section order** and timing on full-length tests: about 2 minutes per question.

## Common questions

**GMAT or GRE?** If you are only applying to business school, the GMAT is the standard and some schools still prefer it. If you are also considering other master's programmes, the GRE keeps more options open.

**Can I cancel a score?** Yes. You can cancel at the test centre or within a few days afterwards, and schools never see cancelled scores.

**How long is a score valid?** 5 years.`,
  },

  // ───────────────────────────── SAT ─────────────────────────────
  {
    name: "SAT",
    slug: "sat",
    summary:
      "The digital SAT is a 2-hour 14-minute admissions test for undergraduate study, used by many universities in the USA and accepted by some in Canada, the UK and elsewhere.",
    facts: [
      { label: "Run by", value: "College Board" },
      { label: "Duration", value: "2 hours 14 minutes (+ 10-min break)" },
      { label: "Score", value: "400–1600 (two sections of 200–800)" },
      { label: "Fee", value: "US$ 68 + US$ 43 international fee (about US$ 111 outside the USA)" },
      { label: "Test type", value: "Digital, on the Bluebook app at a test centre" },
      { label: "Test dates", value: "About 7 a year (Mar, May, Jun, Aug, Oct, Nov, Dec)" },
      { label: "Results", value: "Usually within 2 weeks" },
      { label: "Valid for", value: "Universities usually accept scores up to 5 years old" },
      { label: "Score reports", value: "4 free; about US$ 15 each after" },
      { label: "Best for", value: "US bachelor's degrees and scholarships" },
      { label: "Official site", value: "satsuite.collegeboard.org" },
    ],
    tables: [
      {
        title: "Digital SAT format",
        columns: ["Section", "Questions", "Time", "What it tests"],
        rows: [
          ["Reading & Writing (module 1)", "27", "32 min", "Short passages with one question each: vocabulary, structure, grammar, evidence"],
          ["Reading & Writing (module 2)", "27", "32 min", "Harder or easier depending on module 1"],
          ["Break", "—", "10 min", ""],
          ["Math (module 1)", "22", "35 min", "Algebra, advanced maths, problem solving and data, geometry and trigonometry"],
          ["Math (module 2)", "22", "35 min", "Harder or easier depending on module 1. Calculator allowed throughout."],
        ],
        note: "You take the test on your own laptop or tablet using the Bluebook app, at a test centre. A built-in Desmos graphing calculator is provided.",
      },
      {
        title: "What SAT scores mean",
        columns: ["Total score", "Percentile (approx.)", "Competitive for"],
        rows: [
          ["1500–1600", "98–99+", "Ivy League, MIT, Stanford, top merit scholarships"],
          ["1400–1490", "93–97", "Top 50 US universities"],
          ["1300–1390", "86–92", "Strong state and private universities"],
          ["1200–1290", "74–85", "Many state universities, some scholarships"],
          ["1050–1190", "50–73", "Most universities with open or moderate admission"],
        ],
      },
      {
        title: "SAT fees",
        columns: ["Item", "Approx. fee"],
        rows: [
          ["SAT registration", "US$ 68"],
          ["International regional fee (outside USA)", "US$ 43"],
          ["Late registration", "about US$ 30"],
          ["Changing test date/centre", "about US$ 29"],
          ["Extra score report (each)", "about US$ 15"],
        ],
        note: FEE_NOTE,
      },
    ],
    content: `## What is the SAT?

The SAT is a test of reading, writing and maths used for **undergraduate admission**, mainly in the USA. It is now fully digital and takes just over 2 hours. Many US universities use SAT scores alongside your school grades, and a high score can win **merit scholarships** worth thousands of dollars a year.

## Do I need the SAT?

- **USA**: many universities are "test-optional", but several top universities (for example MIT, Harvard, Yale, Dartmouth, Brown) have brought back test requirements. A strong score helps your application and scholarship chances even where it is optional.
- **Canada**: rarely required, sometimes considered for students from non-standard curricula.
- **UK**: not usually needed. Some universities accept a strong SAT plus AP exams instead of A-levels for students with an American-style education.
- **Other countries**: some universities in Asia and the Middle East accept it.

The SAT does **not** test English for visa or language purposes, so you may still need IELTS, TOEFL or Duolingo.

## How it works

The digital SAT is **adaptive by module**. Your performance in the first module of each section decides whether the second is harder or easier. Doing well in the first module unlocks the highest scores. There is no penalty for wrong answers, so answer every question.

## How to register

1. Create a College Board account at satsuite.collegeboard.org.
2. Register at least **5 weeks before** the test date. International centres fill up quickly.
3. Install the **Bluebook** app on your laptop or tablet and complete the practice test in it.
4. Bring your device (charged), admission ticket and passport on test day.

## Preparation tips

- Use **Bluebook's full-length practice tests**. They are free and match the real test exactly.
- Use **Khan Academy's free official SAT prep**, linked to your College Board account.
- Learn the built-in **Desmos calculator**. It can solve many algebra questions quickly.
- For Reading & Writing, focus on grammar rules (punctuation, verb agreement) and reading short passages carefully.
- Most students improve by 100–200 points with 2–3 months of steady practice.

## Common questions

**How many times can I take it?** As many as you like. Many universities "superscore", taking your best section scores from different dates.

**SAT or ACT?** US universities accept both equally. Take a practice test of each and choose the one you score better on.`,
  },

  // ───────────────────────────── ACT ─────────────────────────────
  {
    name: "ACT",
    slug: "act",
    summary:
      "The ACT is a US undergraduate admissions test of English, maths and reading, with an optional science section. It is accepted by every US university as an alternative to the SAT.",
    facts: [
      { label: "Run by", value: "ACT, Inc." },
      { label: "Duration", value: "2 hours 5 minutes (core); 2 h 45 min with Science" },
      { label: "Score", value: "Composite 1–36 (average of English, Math, Reading)" },
      { label: "Fee", value: "About US$ 165–225 for international students (check current fee)" },
      { label: "Test type", value: "Computer at international test centres" },
      { label: "Results", value: "Usually within 2–8 weeks" },
      { label: "Valid for", value: "Universities usually accept scores up to 5 years old" },
      { label: "Retake", value: "Up to 12 times in total" },
      { label: "Superscore", value: "Many universities combine your best sections" },
      { label: "Best for", value: "US bachelor's degrees and scholarships" },
      { label: "Official site", value: "act.org" },
    ],
    tables: [
      {
        title: "ACT format (enhanced ACT, from 2025)",
        columns: ["Section", "Questions", "Time", "Required?"],
        rows: [
          ["English", "50", "35 min", "Yes"],
          ["Math", "45", "50 min", "Yes"],
          ["Reading", "36", "40 min", "Yes"],
          ["Science", "40", "40 min", "Optional (some universities want it)"],
          ["Writing (essay)", "1", "40 min", "Optional"],
        ],
        note: "The composite score is now the average of English, Math and Reading. Science and Writing get separate scores.",
      },
      {
        title: "What ACT scores mean",
        columns: ["Composite", "Rough SAT equivalent", "Competitive for"],
        rows: [
          ["34–36", "1500–1600", "Ivy League, top 20 universities"],
          ["30–33", "1390–1490", "Top 50 universities, merit scholarships"],
          ["26–29", "1240–1380", "Strong state and private universities"],
          ["22–25", "1110–1230", "Many state universities"],
          ["18–21", "960–1100", "Universities with moderate admission"],
        ],
        note: "Based on the official ACT/SAT concordance.",
      },
    ],
    content: `## What is the ACT?

The ACT is a US admissions test for **bachelor's degrees**, similar to the SAT. Every US university accepts it, and they treat it the same as the SAT. It tests English grammar, maths and reading, with an optional science section.

## What changed?

From 2025 ACT introduced a **shorter "enhanced" ACT**: fewer questions, more time per question, and **Science became optional**. Your composite score (1–36) now comes from English, Math and Reading only. Some STEM programmes still like to see a Science score, so check before you decide.

## SAT or ACT?

| | SAT | ACT |
|---|---|---|
| Time | 2 h 14 min | 2 h 5 min (+40 min Science) |
| Maths | 44 questions, calculator throughout | 45 questions, calculator throughout |
| Adaptive | Yes | No |
| Science | No separate section | Optional section |
| Score | 400–1600 | 1–36 |

If you are quick and like straightforward questions, the ACT may suit you. If you prefer fewer questions with more time to think, the SAT may suit you. Try a free practice test of each.

## Do I need it?

Only if you are applying for undergraduate study in the **USA** (or to an American-style university abroad) and your universities require or recommend a test score. It is also important for many **merit scholarships**. It is not an English language test, so you may still need IELTS, TOEFL or Duolingo.

## How to register

1. Create a MyACT account at act.org.
2. Choose an international test date and centre. Register **4–6 weeks** ahead.
3. Choose up to 4 universities to receive your scores in your registration fee.

## Preparation tips

- Download the free **official ACT practice test** and time yourself strictly.
- **English**: punctuation, sentence structure and concise wording. Learn the rules for commas, semicolons and apostrophes.
- **Math**: covers up to early trigonometry. Make a formula sheet and learn it, because none is given.
- **Reading**: four passages in 40 minutes. Practise reading actively and answering in passage order.
- Aim for **2–3 months** of practice for a significant score increase.

## Common questions

**Can I retake?** Yes, and many universities superscore. You can also retake single sections on some dates.

**Is the ACT harder than the SAT?** Neither is harder overall. They suit different test-takers.`,
  },

  // ───────────────────────── CAMBRIDGE C1 ADVANCED ─────────────────────────
  {
    name: "Cambridge C1 Advanced",
    slug: "cambridge-c1-advanced",
    summary:
      "C1 Advanced (formerly CAE) is a high-level Cambridge English qualification that never expires. It is accepted by most UK universities and thousands of institutions worldwide.",
    facts: [
      { label: "Formerly", value: "Cambridge English: Advanced (CAE)" },
      { label: "Run by", value: "Cambridge University Press & Assessment" },
      { label: "Level", value: "CEFR C1 (advanced)" },
      { label: "Duration", value: "About 4 hours (+ Speaking, 15 min)" },
      { label: "Score", value: "Cambridge English Scale 160–210" },
      { label: "Fee", value: "About £150–£210 in the UK; varies by centre" },
      { label: "Test type", value: "Paper or computer at an authorised centre" },
      { label: "Results", value: "Computer: 2–3 weeks. Paper: 4–6 weeks" },
      { label: "Valid for", value: "Certificate never expires (many universities accept it within 2–3 years)" },
      { label: "Best for", value: "UK and European universities; long-term proof of English" },
      { label: "Official site", value: "cambridgeenglish.org" },
    ],
    tables: [
      {
        title: "C1 Advanced test format",
        columns: ["Paper", "Time", "Parts", "What it tests"],
        rows: [
          ["Reading & Use of English", "1 h 30 min", "8 parts, 56 questions", "Grammar, vocabulary and understanding of long texts"],
          ["Writing", "1 h 30 min", "2 tasks", "An essay, plus a choice of letter, proposal, report or review (220–260 words each)"],
          ["Listening", "about 40 min", "4 parts, 30 questions", "Interviews, talks and conversations"],
          ["Speaking", "15 min", "4 parts", "Face-to-face with two examiners, usually with another candidate"],
        ],
      },
      {
        title: "C1 Advanced scores and IELTS",
        columns: ["Cambridge Scale", "Grade / level", "Rough IELTS"],
        rows: [
          ["200–210", "Grade A (C2 level)", "8.0–8.5"],
          ["193–199", "Grade B (C1)", "7.5"],
          ["185–192", "Grade B/C (C1)", "7.0"],
          ["180–184", "Grade C (C1)", "6.5"],
          ["176–179", "B2 level certificate", "6.0"],
          ["169–175", "B2 level certificate", "5.5"],
          ["160–168", "No certificate", "—"],
        ],
        note: "UK universities usually ask for 176–185 overall for most courses, with minimum scores in each paper.",
      },
    ],
    content: `## What is C1 Advanced?

Cambridge C1 Advanced is an English language qualification at **advanced (C1) level**. Unlike IELTS, TOEFL or PTE, you don't receive a score that expires. You earn a **certificate that lasts for life**. It shows you can follow a university course, write academic work and take part fully in discussions.

It is accepted by almost all UK universities and many in Europe, Australia, Canada and beyond. It is especially popular with students who have studied English at school for many years.

## Is it right for me?

**Good choice if:**
- You already have strong English (around IELTS 6.5 or above).
- You want a qualification that never expires, useful for work and future study too.
- You are applying to UK or European universities that list it.

**Not the right choice if:**
- You need results quickly (it takes weeks).
- You need a **UK visa SELT** test for a course below degree level. Use IELTS for UKVI, PTE UKVI or LanguageCert instead.
- You are applying mainly to the USA, where TOEFL, IELTS or Duolingo are more familiar.

## How it is scored

Each paper (Reading, Use of English, Writing, Listening, Speaking) gets a score on the **Cambridge English Scale**. The overall result is the average:

- **200–210**: Grade A, certificate at C2 level.
- **180–199**: Grades B and C, C1 certificate.
- **160–179**: certificate at B2 level.

## How to book

C1 Advanced is booked through an **authorised Cambridge exam centre**, often a British Council office or a language school. Test dates are less frequent than IELTS, so book **6–8 weeks ahead**.

## Preparation tips

- **Use of English** is the hardest part for most students: phrasal verbs, collocations and word formation. Study them daily.
- Read widely: newspapers, magazines and non-fiction books.
- Practise all writing genres, because you get a choice in Part 2.
- Use official Cambridge past papers and timed mock exams.
- Most students need **2–4 months** of focused preparation.

## Common questions

**Does it expire?** The certificate doesn't, but many universities only accept results from the last 2–3 years. Check before applying.

**Can I take it on computer?** Yes, at many centres, with faster results.`,
  },
];
