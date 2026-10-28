# PRODUCT.md — shafwan.in

## What this is
Personal portfolio of **Shafwan Ahmed** — Full Stack Software Engineer. A multi-page static site at **https://shafwan.in**.

## Who visits, and why
Recruiters, hiring managers and peers — usually on a workday, on any device, often from a search for "Shafwan" or "Shafwan Ahmed". They decide in seconds whether this person is worth contacting.

## What success looks like
1. The site loads near-instantly and ranks #1 on Google for "Shafwan" via shafwan.in.
2. A first-time visitor understands who Shafwan is, sees proof of craft, and knows how to reach him within one viewport.
3. The design itself is the proof: the visitor remembers it.

## Product truth (source: owner's LinkedIn, linkedin.com/in/shafwan23, 2026-09-30)
All content mirrors the LinkedIn profile. When LinkedIn changes, this section and the pages change with it.
- Name: Shafwan Ahmed (brand mark: SHAFWAN). Domain: shafwan.in. Based in Chennai, Tamil Nadu, India.
- Headline: Software Engineer @ Famysys | Full Stack: Next.js, React, TypeScript, Node.js | Ex-ServiceNow Developer (ITSM) | Building toward AI-integrated products & scalable systems.
- Contact: tshafwan23@gmail.com. Profiles: linkedin.com/in/shafwan23, github.com/Shafwan23, leetcode.com/u/Shafwan3. No Twitter on the site.
- Experience: Famysys — Software Engineer (Nov 2025–present, Chennai, on-site); SUMZ Technologies — ServiceNow Developer (Sep 2024–Nov 2025); MYFUNDBOX — Full Stack Developer Intern (Jan–Jun 2024, remote).
- Education: C. Abdul Hakeem College of Engineering & Technology — B.E. Computer Engineering, Sep 2020–Jun 2024, grade 8.4.
- Honours: Smart India Hackathon 2023 Grand Finalist (issued by ISRO, Dec 2023). The SIH case study's technical detail (PS 1521, INSAT-3DR, RF/SVM/CNN, SHAP/LIME) comes from the owner's own submission, `../idea/SIH-I.pdf`.
- Certification: Innovation, Design and Entrepreneurship (IDE) Bootcamp Phase-II, Ministry of Education (Feb 2024).
- Volunteering: Education Volunteer, U&I Trust (Nov 2023–Apr 2025). Languages: Urdu (native or bilingual), English (full professional), Tamil and Hindi (professional working).
- Case studies (/work/): famysys, servicenow, myfundbox, sih-2023. Their plates are drawn illustrations (tools/case-art.html), not product screenshots, and are labelled as such in alt text. No invented metrics.
- Live products (/work/ showroom, 2026-10-29): Famysys Studio (studio.famysys.com), Mini Minds (studiominiminds.com), Fajr International (fajr-international.famysys.com), Saliah Foods (shopzy.famysys.com), GoHighLevel sales dashboards (ghl-dashboard.famysys.com). All five were built at Famysys and are live. Their plates are real screenshots (`tools/live-shots.mjs`); the stacks shown are read from each product's shipped code; the page does not say which parts the owner built alone.
- Private products (2026-10-29), each with a case page: Famysys EMS (/work/famysys-ems/, repo S:/FamySys/famysys_hrms, the owner's employer's internal platform, built solo) and FerroBid (/work/ferrobid/, repo S:/Shafwan/FerroBid, the owner's own project, in progress). Neither is public, so their screenshots come from the apps running locally on demo data (`tools/case-shots.mjs`), the pages say so, and real company names seeded in FerroBid's mock data are swapped for invented ones before the shot. The old rule "never mix FerroBid in" was lifted by the owner on 2026-10-29.
- Photo: src/assets/me.jpg (real).

## Hard constraints
- **Ultra-light**: no animation/3D/audio libraries, no client framework. Static HTML + one CSS file + minimal vanilla JS.
- **SEO-complete**: content in markup, canonical shafwan.in, JSON-LD, sitemap, robots, OG/Twitter cards.
- **Motion is required, not optional** (owner: "wow animations on hover, on scroll, automatically") — but implemented compositor-cheap and disabled under prefers-reduced-motion.
- Legacy React/GSAP/Three app is archived in `legacy/` — anti-reference, not authority.

## Brand commitments
- Visual world pinned by owner: **Luxe Motion Studio** — charcoal, cream and champagne gold (see DESIGN.md).
- Surface mode: **Experience** (portfolio — the work and the craft lead; interface recedes).
