"""
Kenny Academy — Flask website with a file-based CMS.

Editable content (hero text, programme cards, story blocks, values,
lesson types, subjects, achievements, gallery photos, site settings)
lives as JSON in data/ and is edited from /admin — sidebar sections for
Home, About, Curriculum, Gallery, Settings, Subscribers and Inquiries.

Email (contact-form notifications + newsletter subscribe confirmations)
is sent over real SMTP, configured entirely via environment variables
loaded from a .env file (see .env.example). If SMTP_HOST is left blank,
sending is skipped and logged rather than failing the request.

Run:
    pip install -r requirements.txt
    cp .env.example .env   # then fill in real values
    python app.py
Then open http://127.0.0.1:5000
"""
import json
import os
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from functools import wraps

from dotenv import load_dotenv
from flask import (
    Flask, render_template, request, redirect, url_for, session
)
from werkzeug.utils import secure_filename

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
IMG_DIR = os.path.join(BASE_DIR, "static", "img")
ACHIEVEMENTS_FILE = os.path.join(DATA_DIR, "achievements.json")
GALLERY_FILE = os.path.join(DATA_DIR, "gallery.json")
INQUIRIES_FILE = os.path.join(DATA_DIR, "inquiries.json")
CONTENT_FILE = os.path.join(DATA_DIR, "content.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
SUBSCRIBERS_FILE = os.path.join(DATA_DIR, "subscribers.json")

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "kenny2026")
ALLOWED_EXT = {"png", "jpg", "jpeg", "webp", "svg"}

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "kenny-academy-dev-secret-change-me")

# Fallback subject list, only used if content.json has none yet.
DEFAULT_SUBJECTS = [
    "English Language", "Mathematics", "Combined Science", "Physics",
    "Chemistry", "Biology", "Geography", "History", "Shona", "Ndau",
    "Agriculture", "Accounts", "Business Studies", "Commerce",
    "Economics", "Computer Science", "Food & Nutrition",
    "Fashion & Fabrics", "Building Studies", "Woodwork",
    "Metalwork Technology", "Physical Education", "Divinity",
    "Heritage Studies",
]

DEFAULT_SETTINGS = {
    "school_name": "Kenny Academy",
    "group_name": "Kenny Technologies Group of Colleges",
    "tagline": "",
    "logo": "favicon.svg",
    "phone": "",
    "email": "",
    "whatsapp": "",
    "address": "",
    "facebook": "",
    "instagram": "",
    "campuses": [],
}

DEFAULT_CONTENT = {
    "home": {"hero": {}, "programmes": [], "quote": {}},
    "about": {"hero": {}, "story": [], "quote": {}, "values": []},
    "curriculum": {"hero": {}, "subjects": DEFAULT_SUBJECTS, "cs_hexco": {}, "lesson_types": []},
}

# Which sections belong to which page, their editable fields, and shape.
# "single" sections are one object per page (edit-in-place, no add/remove).
# "list" sections are collections (add / edit / delete by index).
# "string_list" sections are lists of plain strings (e.g. subjects).
SECTION_FIELDS = {
    ("home", "hero"): ["eyebrow", "stamp", "title", "subtitle"],
    ("home", "programmes"): ["tag", "title", "body", "bullets"],
    ("home", "quote"): ["quote", "attrib"],
    ("about", "hero"): ["kicker", "title", "body"],
    ("about", "story"): ["heading", "body"],
    ("about", "quote"): ["quote", "attrib"],
    ("about", "values"): ["title", "body"],
    ("curriculum", "hero"): ["kicker", "title", "body"],
    ("curriculum", "subjects"): ["subject"],
    ("curriculum", "cs_hexco"): ["heading", "body", "chips"],
    ("curriculum", "lesson_types"): ["name", "desc", "when"],
}
SINGULAR_SECTIONS = {
    ("home", "hero"), ("home", "quote"),
    ("about", "hero"), ("about", "quote"),
    ("curriculum", "hero"), ("curriculum", "cs_hexco"),
}
STRING_LIST_SECTIONS = {("curriculum", "subjects")}
LIST_FIELDS = {"bullets": "\n", "chips": ","}  # split these into a list on save

PAGE_TEMPLATES = {
    "home": "admin/home.html",
    "about": "admin/about.html",
    "curriculum": "admin/curriculum.html",
    "gallery": "admin/gallery.html",
}


# ---------------------------------------------------------------- data
def _load(path, default):
    if not os.path.exists(path):
        return json.loads(json.dumps(default))  # deep copy
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_achievements():
    return _load(ACHIEVEMENTS_FILE, [])


def get_gallery():
    return _load(GALLERY_FILE, [])


def get_inquiries():
    return _load(INQUIRIES_FILE, [])


def get_content():
    content = _load(CONTENT_FILE, DEFAULT_CONTENT)
    for page, sections in DEFAULT_CONTENT.items():
        content.setdefault(page, {})
        for section, fallback in sections.items():
            content[page].setdefault(section, fallback)
    return content


def get_settings():
    settings = _load(SETTINGS_FILE, DEFAULT_SETTINGS)
    for k, v in DEFAULT_SETTINGS.items():
        settings.setdefault(k, v)
    return settings


def get_subscribers():
    return _load(SUBSCRIBERS_FILE, [])


def stats_from(achievements):
    trophies = sum(1 for a in achievements if a.get("badge") in ("Trophy", "Certificate"))
    individual = sum(1 for a in achievements if a.get("badge") == "Individual award")
    return {"trophies": trophies, "individual_awards": individual}


@app.context_processor
def inject_globals():
    return {"current_year": datetime.now().year, "settings": get_settings()}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def build_item(fields, form):
    item = {}
    for f in fields:
        raw = form.get(f, "").strip()
        if f in LIST_FIELDS:
            item[f] = [v.strip() for v in raw.split(LIST_FIELDS[f]) if v.strip()]
        else:
            item[f] = raw
    return item


# ---------------------------------------------------------------- email
def send_email(to_addr, subject, body):
    """Send a real email over SMTP using credentials from the environment.

    Returns True on success. If SMTP_HOST is unset, sending is skipped
    (logged, not raised) so the site keeps working before email is configured.
    """
    host = os.environ.get("SMTP_HOST", "").strip()
    if not host or not to_addr:
        app.logger.info("SMTP not configured (or no recipient) — skipped email %r to %s", subject, to_addr)
        return False

    port = int(os.environ.get("SMTP_PORT", "587") or 587)
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", "").strip() or user or "no-reply@kennyacademy.co.zw"
    use_tls = os.environ.get("SMTP_USE_TLS", "true").strip().lower() != "false"

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_addr
    msg.set_content(body)

    try:
        context = ssl.create_default_context()
        if use_tls:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls(context=context)
                if user:
                    server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP_SSL(host, port, timeout=10, context=context) as server:
                if user:
                    server.login(user, password)
                server.send_message(msg)
        return True
    except Exception as exc:  # noqa: BLE001 — best-effort, never break the request
        app.logger.warning("Email send to %s failed: %s", to_addr, exc)
        return False


def notify_admin(subject, body):
    settings = get_settings()
    to_addr = os.environ.get("MAIL_TO", "").strip() or settings.get("email", "")
    if to_addr:
        send_email(to_addr, subject, body)


# ------------------------------------------------------------- public
@app.route("/")
def home():
    achievements = get_achievements()
    return render_template(
        "index.html",
        active="home",
        content=get_content()["home"],
        achievements=achievements,
        stats=stats_from(achievements),
        gallery=get_gallery(),
    )


@app.route("/about")
def about():
    return render_template(
        "about.html", active="about",
        content=get_content()["about"],
        achievements=get_achievements(),
    )


@app.route("/curriculum")
def curriculum():
    c = get_content()["curriculum"]
    return render_template(
        "curriculum.html", active="curriculum",
        content=c, subjects=c.get("subjects") or DEFAULT_SUBJECTS,
    )


@app.route("/gallery")
def gallery():
    return render_template(
        "gallery.html", active="gallery", gallery=get_gallery()
    )


@app.route("/contact", methods=["GET", "POST"])
def contact():
    submitted = False
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()
        reason = request.form.get("reason", "").strip()
        message = request.form.get("message", "").strip()
        inquiries = get_inquiries()
        inquiries.append({
            "when": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "name": name, "phone": phone, "reason": reason, "message": message,
        })
        _save(INQUIRIES_FILE, inquiries)
        notify_admin(
            f"New enquiry from {name or 'website visitor'}",
            f"Name: {name}\nPhone: {phone}\nReason: {reason}\n\n{message}",
        )
        submitted = True
    return render_template("contact.html", active="contact", submitted=submitted)


@app.route("/subscribe", methods=["POST"])
def subscribe():
    email_addr = request.form.get("email", "").strip().lower()
    next_url = request.form.get("next") or url_for("home")
    separator = "&" if "?" in next_url else "?"

    if not email_addr or "@" not in email_addr or "." not in email_addr.split("@")[-1]:
        return redirect(f"{next_url}{separator}sub=invalid")

    subs = get_subscribers()
    if any(s.get("email") == email_addr for s in subs):
        return redirect(f"{next_url}{separator}sub=exists")

    subs.append({"email": email_addr, "when": datetime.now().strftime("%Y-%m-%d %H:%M")})
    _save(SUBSCRIBERS_FILE, subs)

    settings = get_settings()
    school = settings.get("school_name", "Kenny Academy")
    send_email(
        email_addr, f"Welcome to {school} updates",
        f"Thanks for subscribing to {school} news and updates.\n\n"
        f"We'll email you about admissions, results and events. "
        f"If this wasn't you, just ignore this message.",
    )
    notify_admin("New newsletter subscriber", f"New subscriber: {email_addr}")
    return redirect(f"{next_url}{separator}sub=ok")


# -------------------------------------------------------------- admin
def login_required(f):
    @wraps(f)
    def wrapped(*a, **kw):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return f(*a, **kw)
    return wrapped


@app.route("/admin", methods=["GET", "POST"])
def admin_login():
    if session.get("admin"):
        return redirect(url_for("admin_page", page="home"))
    error = None
    if request.method == "POST":
        if (request.form.get("username", "").strip() == ADMIN_USERNAME
                and request.form.get("password") == ADMIN_PASSWORD):
            session["admin"] = True
            return redirect(url_for("admin_page", page="home"))
        error = "Incorrect username or password."
    return render_template("admin_login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("admin_login"))


@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    return redirect(url_for("admin_page", page="home"))


# ---- generic content editor: Home / About / Curriculum / Gallery ----
@app.route("/admin/pages/<page>")
@login_required
def admin_page(page):
    if page not in PAGE_TEMPLATES:
        return redirect(url_for("admin_page", page="home"))
    ctx = dict(
        page=page,
        content=get_content(),
        achievements=get_achievements(),
        gallery=get_gallery(),
        subjects_fallback=DEFAULT_SUBJECTS,
        message=request.args.get("message"),
    )
    return render_template(PAGE_TEMPLATES[page], **ctx)


@app.route("/admin/pages/<page>/<section>/save", methods=["POST"])
@login_required
def admin_section_save(page, section):
    key = (page, section)
    if key not in SECTION_FIELDS or key not in SINGULAR_SECTIONS:
        return redirect(url_for("admin_page", page=page))
    content = get_content()
    content.setdefault(page, {})
    content[page][section] = build_item(SECTION_FIELDS[key], request.form)
    _save(CONTENT_FILE, content)
    return redirect(url_for("admin_page", page=page, message="Saved."))


@app.route("/admin/pages/<page>/<section>/add", methods=["POST"])
@login_required
def admin_section_add(page, section):
    key = (page, section)
    if key not in SECTION_FIELDS or key in SINGULAR_SECTIONS:
        return redirect(url_for("admin_page", page=page))
    content = get_content()
    content.setdefault(page, {}).setdefault(section, [])
    if key in STRING_LIST_SECTIONS:
        val = request.form.get("subject", "").strip()
        if val:
            content[page][section].insert(0, val)
    else:
        content[page][section].insert(0, build_item(SECTION_FIELDS[key], request.form))
    _save(CONTENT_FILE, content)
    return redirect(url_for("admin_page", page=page, message="Added."))


@app.route("/admin/pages/<page>/<section>/edit/<int:idx>", methods=["POST"])
@login_required
def admin_section_edit(page, section, idx):
    key = (page, section)
    if key not in SECTION_FIELDS or key in SINGULAR_SECTIONS:
        return redirect(url_for("admin_page", page=page))
    content = get_content()
    items = content.get(page, {}).get(section, [])
    if 0 <= idx < len(items):
        if key in STRING_LIST_SECTIONS:
            items[idx] = request.form.get("subject", "").strip()
        else:
            items[idx] = build_item(SECTION_FIELDS[key], request.form)
        _save(CONTENT_FILE, content)
    return redirect(url_for("admin_page", page=page, message="Updated."))


@app.route("/admin/pages/<page>/<section>/delete/<int:idx>", methods=["POST"])
@login_required
def admin_section_delete(page, section, idx):
    content = get_content()
    items = content.get(page, {}).get(section, [])
    if 0 <= idx < len(items):
        items.pop(idx)
        _save(CONTENT_FILE, content)
    return redirect(url_for("admin_page", page=page, message="Removed."))


# ---- achievements (Home admin page: "Roll of honour") ----
@app.route("/admin/achievements/add", methods=["POST"])
@login_required
def admin_add_achievement():
    achievements = get_achievements()
    achievements.insert(0, {
        "year": request.form.get("year", "").strip(),
        "title": request.form.get("title", "").strip(),
        "detail": request.form.get("detail", "").strip(),
        "badge": request.form.get("badge", "").strip(),
        "win": request.form.get("win") == "true",
    })
    _save(ACHIEVEMENTS_FILE, achievements)
    return redirect(url_for("admin_page", page="home", message="Achievement added."))


@app.route("/admin/achievements/delete/<int:idx>", methods=["POST"])
@login_required
def admin_delete_achievement(idx):
    achievements = get_achievements()
    if 0 <= idx < len(achievements):
        achievements.pop(idx)
        _save(ACHIEVEMENTS_FILE, achievements)
    return redirect(url_for("admin_page", page="home", message="Achievement removed."))


# ---- gallery photos ----
@app.route("/admin/gallery/add", methods=["POST"])
@login_required
def admin_add_gallery():
    photo = request.files.get("photo")
    if photo and photo.filename and allowed_file(photo.filename):
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(IMG_DIR, filename))
        gallery_items = get_gallery()
        gallery_items.insert(0, {
            "file": filename,
            "caption": request.form.get("caption", "").strip(),
            "cat": request.form.get("cat", "campus"),
        })
        _save(GALLERY_FILE, gallery_items)
        return redirect(url_for("admin_page", page="gallery", message="Photo uploaded."))
    return redirect(url_for("admin_page", page="gallery", message="Upload failed — check the file type."))


@app.route("/admin/gallery/delete/<int:idx>", methods=["POST"])
@login_required
def admin_delete_gallery(idx):
    gallery_items = get_gallery()
    if 0 <= idx < len(gallery_items):
        gallery_items.pop(idx)
        _save(GALLERY_FILE, gallery_items)
    return redirect(url_for("admin_page", page="gallery", message="Photo removed."))


# ---- settings: school name, logo, contact details ----
@app.route("/admin/settings", methods=["GET", "POST"])
@login_required
def admin_settings():
    settings = get_settings()
    if request.method == "POST":
        for field in ["school_name", "group_name", "tagline", "phone",
                      "email", "whatsapp", "address", "facebook", "instagram"]:
            settings[field] = request.form.get(field, "").strip()
        settings["campuses"] = [
            c.strip() for c in request.form.get("campuses", "").split("\n") if c.strip()
        ]
        logo = request.files.get("logo")
        if logo and logo.filename and allowed_file(logo.filename):
            filename = secure_filename(logo.filename)
            logo.save(os.path.join(IMG_DIR, filename))
            settings["logo"] = filename
        _save(SETTINGS_FILE, settings)
        return redirect(url_for("admin_settings", message="Settings saved."))
    return render_template("admin/settings.html", settings=settings, message=request.args.get("message"))


# ---- subscribers ----
@app.route("/admin/subscribers")
@login_required
def admin_subscribers():
    return render_template(
        "admin/subscribers.html",
        subscribers=list(reversed(get_subscribers())),
        message=request.args.get("message"),
    )


@app.route("/admin/subscribers/delete/<int:idx>", methods=["POST"])
@login_required
def admin_delete_subscriber(idx):
    subs = get_subscribers()
    real_idx = len(subs) - 1 - idx  # list is shown newest-first in the template
    if 0 <= real_idx < len(subs):
        subs.pop(real_idx)
        _save(SUBSCRIBERS_FILE, subs)
    return redirect(url_for("admin_subscribers", message="Subscriber removed."))


# ---- inquiries (read-only) ----
@app.route("/admin/inquiries")
@login_required
def admin_inquiries():
    return render_template("admin/inquiries.html", inquiries=list(reversed(get_inquiries())))


if __name__ == "__main__":
    app.run(debug=True)
