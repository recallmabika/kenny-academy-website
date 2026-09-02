"""
Kenny Academy — Flask website with a small file-based CMS.

Achievements and gallery photos are stored as JSON in data/ and are
editable from /admin (single shared password, set via ADMIN_PASSWORD
env var — defaults to 'kenny2026' for local development only).

Run:
    pip install flask
    python app.py
Then open http://127.0.0.1:5000
"""
import json
import os
from datetime import datetime
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for, session, flash
)
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
IMG_DIR = os.path.join(BASE_DIR, "static", "img")
ACHIEVEMENTS_FILE = os.path.join(DATA_DIR, "achievements.json")
GALLERY_FILE = os.path.join(DATA_DIR, "gallery.json")
INQUIRIES_FILE = os.path.join(DATA_DIR, "inquiries.json")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "kenny2026")
ALLOWED_EXT = {"png", "jpg", "jpeg", "webp"}

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "kenny-academy-dev-secret-change-me")

SUBJECTS = [
    "English Language", "Mathematics", "Combined Science", "Physics",
    "Chemistry", "Biology", "Geography", "History", "Shona", "Ndau",
    "Agriculture", "Accounts", "Business Studies", "Commerce",
    "Economics", "Computer Science", "Food & Nutrition",
    "Fashion & Fabrics", "Building Studies", "Woodwork",
    "Metalwork Technology", "Physical Education", "Divinity",
    "Heritage Studies",
]


# ---------------------------------------------------------------- data
def _load(path, default):
    if not os.path.exists(path):
        return default
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


def stats_from(achievements):
    trophies = sum(1 for a in achievements if a.get("badge") in ("Trophy", "Certificate"))
    individual = sum(1 for a in achievements if a.get("badge") == "Individual award")
    return {"trophies": trophies, "individual_awards": individual}


@app.context_processor
def inject_globals():
    return {"current_year": datetime.now().year}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


# ------------------------------------------------------------- public
@app.route("/")
def home():
    achievements = get_achievements()
    return render_template(
        "index.html",
        active="home",
        achievements=achievements,
        stats=stats_from(achievements),
        gallery=get_gallery(),
    )


@app.route("/about")
def about():
    return render_template(
        "about.html", active="about", achievements=get_achievements()
    )


@app.route("/curriculum")
def curriculum():
    return render_template(
        "curriculum.html", active="curriculum", subjects=SUBJECTS
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
        inquiries = get_inquiries()
        inquiries.append({
            "when": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "name": request.form.get("name", "").strip(),
            "phone": request.form.get("phone", "").strip(),
            "reason": request.form.get("reason", "").strip(),
            "message": request.form.get("message", "").strip(),
        })
        _save(INQUIRIES_FILE, inquiries)
        submitted = True
    return render_template("contact.html", active="contact", submitted=submitted)


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
        return redirect(url_for("admin_dashboard"))
    error = None
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        error = "Incorrect password."
    return render_template("admin_login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("admin_login"))


@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    return render_template(
        "admin_dashboard.html",
        achievements=get_achievements(),
        gallery=get_gallery(),
        inquiries=list(reversed(get_inquiries())),
        message=request.args.get("message"),
    )


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
    return redirect(url_for("admin_dashboard", message="Achievement added."))


@app.route("/admin/achievements/delete/<int:idx>", methods=["POST"])
@login_required
def admin_delete_achievement(idx):
    achievements = get_achievements()
    if 0 <= idx < len(achievements):
        achievements.pop(idx)
        _save(ACHIEVEMENTS_FILE, achievements)
    return redirect(url_for("admin_dashboard", message="Achievement removed."))


@app.route("/admin/gallery/add", methods=["POST"])
@login_required
def admin_add_gallery():
    photo = request.files.get("photo")
    if photo and photo.filename and allowed_file(photo.filename):
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(IMG_DIR, filename))
        gallery = get_gallery()
        gallery.insert(0, {
            "file": filename,
            "caption": request.form.get("caption", "").strip(),
            "cat": request.form.get("cat", "campus"),
        })
        _save(GALLERY_FILE, gallery)
        return redirect(url_for("admin_dashboard", message="Photo uploaded."))
    return redirect(url_for("admin_dashboard", message="Upload failed — check the file type."))


@app.route("/admin/gallery/delete/<int:idx>", methods=["POST"])
@login_required
def admin_delete_gallery(idx):
    gallery = get_gallery()
    if 0 <= idx < len(gallery):
        gallery.pop(idx)
        _save(GALLERY_FILE, gallery)
    return redirect(url_for("admin_dashboard", message="Photo removed."))


if __name__ == "__main__":
    app.run(debug=True)
