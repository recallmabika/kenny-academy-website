# Kenny Academy — website

Flask site for Kenny Technologies Group of Colleges (Kenny Academy
Rimbi & Rimai), with a full sidebar CMS for page content, site
settings, a newsletter, and contact inquiries.

## Run it

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then fill in real values (see below)
python app.py
```

Open http://127.0.0.1:5000

## Pages

- `/` — Home
- `/about` — About, full roll of honour, director profile
- `/curriculum` — Forms, subjects, Computer Science & HEXCO, lesson types
- `/gallery` — Filterable photo gallery
- `/contact` — Contact form (saved to `data/inquiries.json`, emailed if SMTP is configured)

Every one of these pages also has a light/dark mode toggle in the
header (persisted in the browser) and a scroll-progress line across
the very top of the viewport, above the nav bar.

## The CMS (`/admin`)

Sign in at `/admin` with `ADMIN_PASSWORD` (see **Environment** below).
The sidebar has:

- **Home** — hero banner text, the three "what's on offer" programme
  cards (add/edit/remove), the director's quote, and the roll-of-honour
  achievements list (add/remove).
- **About** — hero text, the two story blocks (add/edit/remove), the
  quote, and the "what we hold to" values (add/edit/remove).
- **Curriculum** — hero text, the subject list (add/remove chips),
  the Computer Science & HEXCO block, and lesson types (add/edit/remove).
- **Gallery** — upload or remove photos.
- **Settings** — school name, group name, tagline, logo, phone,
  WhatsApp, email, address, Facebook/Instagram links, and the list
  of campuses. Everything here feeds the header, footer, and contact
  page automatically.
- **Subscribers** — everyone who has signed up via the footer
  newsletter form, with the option to remove an entry.
- **Inquiries** — a read-only log of contact-form submissions.

Data is stored as plain JSON in `data/` — no database required:

```
data/content.json       Editable page copy (hero/programmes/story/values/etc.)
data/settings.json      School name, logo, contact details, socials, campuses
data/achievements.json  Roll of honour entries
data/gallery.json       Gallery photo entries
data/subscribers.json   Newsletter subscribers
data/inquiries.json     Submitted contact form messages
```

If the college later wants multiple admin accounts, richer editing,
or image cropping, swap the JSON store for a proper database (e.g.
SQLite via Flask-SQLAlchemy) behind the same routes — the route
signatures won't need to change.

## Environment (`.env`)

Copy `.env.example` to `.env` and fill in real values. Nothing here
is committed (see `.gitignore`).

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Flask session signing key — use a long random string |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USE_TLS` | Your mail provider's SMTP server |
| `SMTP_USER` / `SMTP_PASSWORD` | Mailbox credentials (an app password for Gmail, etc.) |
| `SMTP_FROM` | The "From" address/name on outgoing mail |
| `MAIL_TO` | Where contact-form and new-subscriber notifications land. Falls back to the "email" field in Settings if left blank |

If `SMTP_HOST` is left blank, the site still works — sending is
skipped and logged instead of failing the request, so you can develop
locally without a real mailbox configured.

**What gets emailed:**
- A new **contact form** submission notifies `MAIL_TO`.
- A new **newsletter subscribe** (footer form on every page) sends a
  welcome email to the subscriber and notifies `MAIL_TO`.

## Structure

```
app.py                  Flask routes, CMS data helpers, SMTP email sending
.env.example             Documented environment variables (copy to .env)
data/                    JSON content store (see table above)
templates/               Jinja templates — base.html + one per public page
templates/admin/         Sidebar CMS templates (Tailwind-based)
templates/admin_login.html
static/css/style.css     Design system (vanilla CSS) + dark-mode variable overrides
static/js/main.js        Nav toggle, theme toggle, scroll progress bar, reveals, ticker, tally count-up
static/img/              Photos, logo mark, favicon
```

## Design

The visual identity ("Roll of Honour") borrows the red margin rule
printed down every Zimbabwean exercise book and turns it into the
page's structural spine, paired with ledger-row achievement listings
and a scoreboard-style stats section — grounded in the fact that this
is a school that keeps both an exam register and a trophy shelf.
Colours are the brief's red and white, set in Fraunces (serif display)
and Space Mono (labels/body), with no gradients, rounded corners or
emoji, per the brief.

The public site's bespoke layout stays as hand-written CSS (custom
properties drive both the light and dark themes); Tailwind (via CDN,
`darkMode: 'class'`) is used for the newer additions — the dark/light
toggle, the scroll-progress bar, the subscribe form, and the entire
admin CMS sidebar — anywhere a utility-first approach was a better
fit than extending the bespoke stylesheet.
