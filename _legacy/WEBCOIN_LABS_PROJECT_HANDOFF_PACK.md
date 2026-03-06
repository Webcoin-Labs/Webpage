# WEBCOIN LABS — PROJECT HANDOFF PACK

---

## 1) REPO SUMMARY

- **Framework / stack**
  - **Backend**: Node.js + Express + Mongoose + Socket.IO, simple session-based auth.
  - **Frontend**: Mostly **static HTML** pages using a commercial template ("Digimax - SEO & Digital Marketing Agency HTML Template") with jQuery-based interactions and CSS in `assets/css`.
  - **Data store**: Local MongoDB (`mongodb://localhost:27017/WebCoinLABS`) with a single `users` collection (fields: `Email`, `Password`).

- **How to run locally**

  ```bash
  # from repo root
  npm install
  npm run dev      # runs node server.js
  ```

  - Server listens on **http://localhost:8000**.
  - Requires **MongoDB running locally** on port 27017.

- **Known / recent errors**
  - Previously: `Error: Cannot find module 'socket.io'` when running `node server.js` → fixed by adding `socket.io` dependency.
  - If MongoDB is not running or DB `WebCoinLABS` is unreachable, `mongoose.connect` will log an error but Express will still start; DB-backed flows (signup/login) will fail.
  - No other obvious runtime errors are visible from the code alone, but:
    - Passwords are stored **in plaintext**.
    - Session secret is hard-coded (see `server.js`), which is acceptable for local dev but not production.

---

## 2) DIRECTORY TREE (max depth 4, excluding node_modules, .git, build outputs)

```
.
├─ package.json
├─ package-lock.json
├─ server.js
├─ home.html
├─ portfolio.html
├─ launchpad.html
├─ VC.html
├─ signup.html
├─ signup.css
├─ signup.js
├─ assets/
│  ├─ css/
│  │  ├─ style.css
│  │  ├─ responsive.css
│  │  ├─ owl.carousel.min.css
│  │  ├─ jquery.fancybox.min.css
│  │  ├─ bootstrap.min.css
│  │  ├─ aos.css
│  │  ├─ animate.min.css
│  │  └─ all.min.css
│  ├─ js/
│  │  ├─ index.js
│  │  ├─ active.js
│  │  ├─ jquery/
│  │  │  └─ jquery-3.5.1.min.js
│  │  ├─ bootstrap/
│  │  │  ├─ popper.min.js
│  │  │  └─ bootstrap.min.js
│  │  └─ plugins/
│  │     └─ plugins.min.js
│  ├─ img/
│  │  ├─ bg/
│  │  │  └─ stars.svg
│  │  └─ error/
│  │     ├─ 404.svg
│  │     ├─ astronaut.svg
│  │     ├─ earth.svg
│  │     ├─ moon.svg
│  │     ├─ rocket.svg
│  │     └─ stars.svg
│  ├─ font/
│  │  ├─ flaticon.html
│  │  ├─ flaticon.css
│  │  ├─ _flaticon.scss
│  │  └─ Flaticon.svg
│  └─ php/
│     └─ mail.php
├─ images/                 # referenced by home/portfolio pages for logos
├─ New Design of logo/     # PNG logo grid assets (TRUNCATED)
├─ launchpad/              # PNG launchpad/cex logos (TRUNCATED)
└─ vcs/                    # PNG VC/media partner logos (TRUNCATED)
```

---

## 3) CONFIG + ENTRYPOINTS

### package.json

```json
{
  "name": "Webcoin-labs---Blockchain-Venture-and-Web3-Marketing-agency",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "express-socket.io-session": "^1.3.5",
    "mongoos": "^0.0.1-security",
    "mongoose": "^8.3.2",
    "socket.io": "^4.7.5"
  }
}
```

### server.js (Express + Mongo + Socket.IO entrypoint)

> Note: session secret value redacted in this export.

```javascript
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const session = require('express-session');
const sharedsession = require("express-socket.io-session");
const bodyparser = require("body-parser");
const socketIO = require("socket.io");

mongoose.connect("mongodb://localhost:27017/WebCoinLABS").then(() => console.log("MongoDB Connected")).catch((err) => console.log(err));
app.use(express.static("./"));
let sessionMiddleware = session({
    secret: "<REDACTED>",
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 6000000
    }
});
app.use(sessionMiddleware);
app.use(bodyparser.urlencoded({extended: true}));

const server = app.listen(8000, () => {
    console.log("Listening Server at 8000");
});
const io = socketIO(server);

const schema = new mongoose.Schema(
    {
        Email: { type: String },
        Password: { type: String }
    }
);
const users = mongoose.model("users", schema);

app.get("/", (req, res) => {
    res.sendFile("signup.html", {root: "./"});
});
app.post("/", async (req, res) => {
    console.log("Added: ", JSON.stringify(req.body));
    const result = await users.create({
        Email: req.body.email,
        Password: req.body.password,
    });
    res.redirect("/login");
});
app.get("/login", (req, res) => {
    res.sendFile("signup.html", {root: "./"});
});

app.get("/home", (req, res) => {
    if (req.session.email) {
        res.sendFile("home.html", {root: "./"});
    } else {
        res.send("you are not authorised")
    }
});
app.get("/portfolio", (req, res) => {
    if (req.session.email) {
        res.sendFile("portfolio.html", {root: "./"});
    } else {
        res.send("you are not authorised")
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/login');
    });
});

io.use(sharedsession(sessionMiddleware, { autoSave: true }));
io.on("connection", (socket) => {
    socket.on("Login", async (data) => {
        const email = data.email;
        const pass = data.pass;
        console.log(data);
        const result = await users.findOne({Email: email});
        if (result && result.Password === pass) {
            socket.handshake.session.email = data.email;
            socket.handshake.session.save();
            socket.emit("Login", "login Successfull");
        } else {
            socket.emit("Login", "Email or Password is Wrong")
        }
    });
});
```

- **Other configs**: No `vite.config`, `webpack.config`, `tailwind.config`, `tsconfig` or `.env.example` files present.

---

## 4) CORE PAGES / ROUTES (WEBSITE CONTENT)

### Routing overview

| Route | File | Purpose |
|-------|------|---------|
| `/` | signup.html | Login/signup UI; Socket.IO login |
| `/login` | signup.html | Same as `/` |
| `/home` | home.html | Authenticated homepage |
| `/portfolio` | portfolio.html | Authenticated portfolio + VC + launchpad sections |
| `/logout` | — | Destroys session, redirects to `/login` |

### Page list and purpose

- **signup.html** — Combined login & signup form (login via Socket.IO, signup via POST `/` to Express/Mongo).
- **home.html** — Main logged-in homepage: hero, services, about, stats, portfolio grid, VC & launchpad sections, CTAs, footer.
- **portfolio.html** — Standalone portfolio-style page (logo grids) plus contact and CTA; uses `/home` as “Go Back”.
- **VC.html** — VC & Media Partners gallery page; includes contact & CTA.
- **launchpad.html** — Launchpad & CEX Partners gallery page; includes contact & CTA.
- **No index.html** — Several pages link to `index.html` as the public homepage; that file does not exist, so those links 404.

### Key HTML files (references)

- **home.html** — Full authenticated homepage (~1431 lines). Contains: preloader, header/nav, hero (“Grow Your Product with Webcoin Labs”), services, about/stats, benefits for projects, content sections, portfolio grid, VC & launchpad partner grids, CTA, footer, modals, and script includes (jQuery, Bootstrap, plugins, active.js).
- **portfolio.html**, **launchpad.html**, **VC.html** — Similar structure; hero or section heading plus logo grids, contact form, CTA, footer. Nav on launchpad/VC links to `index.html` (missing).
- **signup.html** — Login/signup slide form, Socket.IO client for login, signup form POST to `/`.

---

## 5) STYLES + UI / INTERACTION JS

### signup.js (form tab switch)

```javascript
const loginText = document.querySelector(".title-text .login");
const loginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");
signupBtn.onclick = (()=>{
  loginForm.style.marginLeft = "-50%";
  loginText.style.marginLeft = "-50%";
});
loginBtn.onclick = (()=>{
  loginForm.style.marginLeft = "0%";
  loginText.style.marginLeft = "0%";
});
signupLink.onclick = (()=>{
  signupBtn.click();
  return false;
});
```

### signup.css

- Login/signup page styling: Poppins font, gradient background, wrapper, slide controls, form fields, buttons. (~186 lines; see repo.)

### assets/js/index.js

- Popup logic: close button and delayed show on load (only if `.popup` exists).

### assets/js/active.js

- Main template behavior: preloader, responsive nav clone into modal, sticky header, scroll-to-top, smooth scroll for `.scroll` links, AOS, WOW, counterUp, Fancybox, circle animation, owl carousel reviews, Shuffle portfolio filter, contact form AJAX POST to `assets/php/mail.php`.

### assets/css/style.css & assets/css/responsive.css

- Digimax template: global typography, layout, feature/pricing cards, nav, hero, services, portfolio grids, contact, footer, error-area. **TRUNCATED** (see repo for full files).

---

## 6) CURRENT COPY (TEXT EXTRACTION — HOMEPAGE ORDER)

From **home.html**, in on-page order:

- **Hero headline:** “Grow Your Product with Webcoin Labs”
- **Hero subtext:** “A world class community-backed Capital investing in top block chain projects of future.”
- **Hero buttons:** Contact, Mail, Kol (mailto / Telegram)
- **Nav:** Home, Services, Projects, About, Portfolio, Contact; Instagram, Twitter
- **Services section title:** “We provide the best digital services.”
- **Service cards:** Data Analytics, Website Growth, Seo Ranking, Web Development, Email Marketing, Affiliate Marketing (each with short description + “Learn More”)
- **Stats block:** “Digital currency in our expertise” — 500K+ COMMUNITY, 500+ KOL's, 100+ INCUBATED PROJECTS
- **Benefits for projects:** “Benefits for projects” / “Here's what services we offers to projects.” — FULL INCUBATION, ADVISORY SERVICE, KOL'S SERVICE (with descriptions)
- **About:** “We help to grow your business.” + “A financial plan to determine what capital is accessible during growth.” + “Online Presence” bullet (Webcoin Capital / blockchain startups)
- **Second content block:** “Work smarter, not harder.” — Digital Agency & Marketing, Planning To Startup, Content Management + “Learn More”
- **Portfolio:** “Portfolio” + logo grid + “View More”
- **VC’s & Media Partners** + **Launchpad & CEX Partners** — section titles + logo grids + “View More”
- **CTA:** “Looking for the best digital agency & marketing solution?” + “Contact Us”
- **Footer:** About Us, Services, Support, Follow Us (with link lists); “© All rights reseved by Webcoin Labs.”

---

## 7) ISSUES LIST (IMPORTANT)

### Why http://localhost:8000 was failing

- Node crashed on startup with: **`Error: Cannot find module 'socket.io'`** at `require('socket.io')` in `server.js`. With no process bound to port 8000, the site was unreachable.

### Correct way to run the app

```bash
cd E:\webcoinlabs    # or your repo root
npm install
npm run dev
```

- Expected: “MongoDB Connected” (if MongoDB is up) and “Listening Server at 8000”.

### Port

- App listens on **port 8000** (`app.listen(8000, ...)`). No port mismatch in the frontend.

### Other failure modes

- **MongoDB not running / wrong URI:** Server still starts but DB operations (e.g. signup) fail.
- **Static-only:** If you serve the repo as static files only (e.g. `npx serve .`), login, session, and Socket.IO will not work; they depend on the Express server.

---

## 8) “INTRODUCING WEBCOIN LABS 2.0” NOTES

### Current site weaknesses

- **Structure:** Multiple similar pages (home, portfolio, VC, launchpad) with duplicated template and grids; nav references missing `index.html`; auth bolted onto a static-style site.
- **Messaging:** Generic taglines (“best digital services”, “best digital agency & marketing solution”); mix of Web2 (SEO, email) and Web3 (venture/incubation) without clear hierarchy.
- **Outdated / rough:** Template-era look and copy; plaintext passwords; login via Socket.IO overlay; commented-out blocks and unused PHP contact form.

### Sections to add / remove / rename (for 2.0)

**Add / redesign:**

- Clear hero for “Web3 Venture Studio & Capital” with 1–2 primary CTAs.
- Case studies / portfolio detail (projects, outcomes, testimonials).
- Services split into: Incubation & Capital, Launch & Growth Marketing, KOL & Community, Advisory & Tokenomics.
- Team & network (bios, partner VCs, KOL stats, community metrics).
- “Work with us” / Launchpad funnel: Application → Discovery → Incubation → Launch → Post-launch, with application form.

**Remove / consolidate:**

- Redundant logo grids across home, portfolio, VC, launchpad; one “Ecosystem” page + lean logo strip on homepage.
- Template filler (404-style hero decoration, unused search modal copy).
- Duplicate contact blocks; one section with email + Telegram + calendar.

**Rename / restructure:**

- Nav: e.g. Home · Services · Portfolio · Network · Launchpad · Contact.
- Treat `/home` as the **public** homepage; move any authenticated/KPI views to a separate `/dashboard` or app.

### Top 5 priorities for refactor

1. **Clarify architecture** — Decide: static marketing site vs separate authenticated admin; avoid mixing login into marketing pages.
2. **Modernize stack** — Move from jQuery + PHP mail to a modern frontend (React/Next/Remix, etc.) with a design system and typed API; keep or replace Node/Express for forms and lead capture.
3. **Rebuild information architecture** — Clear flow: Problem → What Webcoin Labs is → What we do → Proof (portfolio) → Network → How to start → Contact.
4. **Strengthen messaging for Web3** — Emphasize incubation track record, KOL network, capital + launchpad relationships, community distribution; reduce generic SEO/email copy.
5. **Security and data hygiene** — Proper auth (hashed passwords, validation, CSRF, rate limiting) or remove login from marketing site; treat marketing site as stateless and handle user data in a dedicated backend.

---

*End of Webcoin Labs Project Handoff Pack*
