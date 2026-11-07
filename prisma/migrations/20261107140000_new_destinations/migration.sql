-- Content for the new study destinations (flags already uploaded to media storage).
-- Countries from the world list become destinations; Northern Cyprus is added.
-- Values staff already filled in are kept.
INSERT INTO "Country" ("id", "name", "slug", "isDestination", "updatedAt")
VALUES ('cntry_northern_cyprus', 'Northern Cyprus', 'northern-cyprus', true, now())
ON CONFLICT DO NOTHING;

CREATE TEMP TABLE new_destinations (name TEXT, flag TEXT, tagline TEXT, description TEXT, content TEXT, sort INT);
INSERT INTO new_destinations VALUES
('Lithuania', 'https://media.nrcedu-uk.com/images/2026/11/15d25fd4-ebd8-42b9-a6cd-c3ba12a2bb9b.webp',
 $$Affordable EU degrees in a safe, modern country$$,
 $$Low tuition fees and living costs, English-taught degrees and a European Union qualification recognised across Europe.$$,
 $$Lithuania is one of the most affordable places to earn a European Union degree. Universities such as Vilnius University, Kaunas University of Technology and Vilnius Gediminas Technical University offer many bachelor's and master's programs taught fully in English, with tuition fees well below Western Europe. Living costs are low, cities are safe and English is widely spoken by young people. International students can work part-time during their studies, and graduates can stay to look for work. The main intake is in September, with some programs also starting in February.$$, 10),
('Hungary', 'https://media.nrcedu-uk.com/images/2026/11/fbdc72fd-641f-4429-bb42-90eace5fe824.webp',
 $$Respected degrees at the heart of Europe$$,
 $$Well-known medical and engineering schools, affordable fees and living costs, and a central European location.$$,
 $$Hungary has a long academic tradition and is especially popular for medicine, dentistry, engineering and business. Universities such as Semmelweis University, the University of Debrecen, the University of Szeged and Budapest University of Technology and Economics teach many programs in English. Tuition and living costs are lower than in most of Western Europe, and Budapest is a lively student city. International students can work part-time during their studies, and graduates can stay to look for work. The main intake is in September, with some programs starting in February.$$, 11),
('Malta', 'https://media.nrcedu-uk.com/images/2026/11/fd93406f-93de-48b5-9385-b5b2e7e8ebac.webp',
 $$English-speaking study in the Mediterranean$$,
 $$An English-speaking EU country with British-style degrees, a safe island lifestyle and a warm climate all year.$$,
 $$Malta is a small European Union country where English is an official language, so teaching and daily life are in English. Its education system follows the British model, and institutions such as the University of Malta and MCAST offer degrees in business, IT, tourism, health and more. Malta is safe and friendly, with a warm climate and a central position in the Mediterranean. International students can work part-time during their studies, and graduates can apply to stay and work. Main intakes are in September and February.$$, 12),
('France', 'https://media.nrcedu-uk.com/images/2026/11/615041a1-377a-4e2a-b3ff-2e7df94451f7.webp',
 $$World-famous business schools and low public fees$$,
 $$Top business and engineering schools, affordable public universities and a post-study stay permit for graduates.$$,
 $$France is home to some of the world's best-known business and engineering schools, including HEC Paris, ESSEC, INSEAD and Sciences Po, alongside low-cost public universities. Many master's and MBA programs are taught fully in English. International students can work up to 964 hours a year, about 20 hours a week, during their studies. After a master's degree, graduates can apply for a temporary residence permit to stay and look for work. The main intake is in September, and many schools also offer January intakes.$$, 13),
('Spain', 'https://media.nrcedu-uk.com/images/2026/11/5b663442-6ac6-492e-9380-bab9989dfbaa.webp',
 $$Top business schools and a great quality of life$$,
 $$Leading business schools, English-taught programs, a high quality of life and part-time work rights for students.$$,
 $$Spain combines respected universities with one of the best student lifestyles in Europe. It is especially known for business, with schools such as IE Business School, ESADE and EAE Business School, as well as large public universities in Madrid, Barcelona and Valencia. Many master's programs are taught in English. International students can work up to 30 hours a week during their studies, and graduates can apply to stay and look for work. Main intakes are in September and October, with some programs also starting in January or February.$$, 14),
('Northern Cyprus', 'https://media.nrcedu-uk.com/images/2026/11/01cdc61e-2644-46ff-bde0-7b787bc96efc.webp',
 $$Low-cost, English-taught degrees by the sea$$,
 $$Some of the lowest tuition fees in the region, English-taught degrees, scholarships and a simple admission process.$$,
 $$Northern Cyprus is a popular choice for students looking for an affordable degree taught in English. Universities such as Eastern Mediterranean University, Near East University, Cyprus International University and Girne American University offer programs in engineering, business, medicine, IT and more, often with generous scholarships. Admission is straightforward and living costs are low. Degrees are internationally accredited, but recognition can vary by country, so we check this with you before you apply. Main intakes are in September and February.$$, 15),
('Cyprus', 'https://media.nrcedu-uk.com/images/2026/11/1b1ac8d4-303b-472b-ae3e-3e7425bffdd6.webp',
 $$EU degrees on a sunny Mediterranean island$$,
 $$European Union degrees taught in English, a safe island lifestyle and lower costs than most of Western Europe.$$,
 $$Cyprus is a European Union member where English is widely spoken, making it an easy place to study and live. Universities such as the University of Cyprus, the University of Nicosia, European University Cyprus and Frederick University offer degrees in business, medicine, IT, hospitality and more, many taught fully in English. Tuition and living costs are lower than in most of Western Europe, and the island is safe with a warm climate. International students can work part-time during their studies. Main intakes are in September and in January or February.$$, 16),
('South Korea', 'https://media.nrcedu-uk.com/images/2026/11/07f70444-85e6-46e5-b0a1-86242a08d505.webp',
 $$High-tech study in one of Asia's leading countries$$,
 $$Highly ranked universities, strong technology and research, generous scholarships and a post-study job-seeker visa.$$,
 $$South Korea is a world leader in technology and innovation, with highly ranked universities such as Seoul National University, KAIST, Yonsei University and Korea University. Many programs are taught in English, and the Global Korea Scholarship and university awards can cover tuition and living costs. International students can work part-time after their first semester, and graduates can apply for a job-seeker visa to stay and look for work. Main intakes are in March (spring) and September (fall).$$, 17),
('Malaysia', 'https://media.nrcedu-uk.com/images/2026/11/f05aa302-36a9-4099-81b2-c82968455f46.webp',
 $$Affordable degrees, including from UK branch campuses$$,
 $$Low costs, English-taught degrees and branch campuses of UK and Australian universities in a welcoming country.$$,
 $$Malaysia offers quality education at a low cost, with English as the main language of teaching. As well as respected local universities such as Universiti Malaya and Taylor's University, it hosts branch campuses of UK and Australian universities, including the University of Nottingham, Heriot-Watt University and Monash University, so you can earn a foreign degree for much less. Living costs are low, and the country is modern, multicultural and welcoming. International students can work part-time during semester breaks. There are several intakes a year, mainly in February, July and September.$$, 18);

UPDATE "Country" AS c
SET "isDestination" = true,
    "flagUrl" = COALESCE(c."flagUrl", n.flag),
    "tagline" = COALESCE(c."tagline", n.tagline),
    "description" = COALESCE(c."description", n.description),
    "content" = COALESCE(c."content", n.content),
    "sortOrder" = CASE WHEN c."sortOrder" = 0 THEN n.sort ELSE c."sortOrder" END,
    "updatedAt" = now()
FROM new_destinations AS n
WHERE c."name" = n.name;

DROP TABLE new_destinations;
