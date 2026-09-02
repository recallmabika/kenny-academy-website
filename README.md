# Kenny Academy — website

Flask site for Kenny Technologies Group of Colleges (Kenny Academy
Rimbi & Rimai), with a small built-in CMS for achievements, gallery
photos and contact inquiries.

## Run it

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

## Pages

- `/` — Home
- `/about` — About, full roll of honour, director profile
- `/curriculum` — Forms, subjects, Computer Science & HEXCO, lesson types
- `/gallery` — Filterable photo gallery
- `/contact` — Contact form (saved to `data/inquiries.json`)

## The CMS (`/admin`)

Default password: `kenny2026` — **change this before putting the site
online**, either by editing `ADMIN_PASSWORD` in `app.py` or, better,
setting it as an environment variable:

```bash
export ADMIN_PASSWORD="something-only-you-know"
export SECRET_KEY="a-long-random-string"
python app.py
```

From `/admin` you can:
- Add or remove entries in the **roll of honour** (achievements/trophies)
- Upload or remove **gallery photos**
- Read submitted **contact inquiries**

Data is stored as plain JSON in `data/` — no database required. This
keeps the CMS simple to inspect and back up; if the college later
wants multiple admin accounts, richer editing, or image cropping,
swap the JSON store for a proper database (e.g. SQLite via
Flask-SQLAlchemy) behind the same routes.

## Structure

```
app.py                  Flask routes + JSON data helpers
data/achievements.json  Roll of honour entries
data/gallery.json       Gallery photo entries
data/inquiries.json     Submitted contact form messages
templates/              Jinja templates (base.html + one per page)
static/css/style.css    Design system
static/js/main.js       Nav toggle, scroll reveals, ticker, tally count-up
static/img/             Photos, logo mark, favicon
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
