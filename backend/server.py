
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import random
import bcrypt
import re

app = Flask(__name__)
CORS(app)  # Allow frontend to talk to backend

# --- Configuration ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret')

# Database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///grievance_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Mail
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'demo@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'demo_password')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'support@kluniversity.in')

mail = Mail(app)
db = SQLAlchemy(app)

DOMAIN_WHITELIST = os.getenv('ALLOWED_UNIVERSITY_DOMAINS', 'kluniversity.in').split(',')
MAX_RESEND_ATTEMPTS = int(os.getenv('MAX_OTP_ATTEMPTS', 3))
OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', 10))
OTP_COOLDOWN_SECONDS = int(os.getenv('OTP_COOLDOWN_SECONDS', 60))

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    course = db.Column(db.String(50), nullable=True)     # Added
    department = db.Column(db.String(50), nullable=True) # Added
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    otp_hash = db.Column(db.String(128), nullable=False)
    expiry = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    resend_count = db.Column(db.Integer, default=0)
    last_resend = db.Column(db.DateTime, default=datetime.utcnow)

# --- Helper Functions ---
def generate_otp():
    return str(random.randint(100000, 999999))

def hash_otp(otp):
    return bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_otp(otp, hashed_otp):
    return bcrypt.checkpw(otp.encode('utf-8'), hashed_otp.encode('utf-8'))

# --- Routes ---

@app.route('/')
def home():
    return jsonify({"message": "Backend is running!", "status": "ok"}), 200

@app.before_request
def setup():
    db.create_all()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email', '').strip().lower()
    student_id = data.get('student_id', '').strip()
    course = data.get('course', '').strip()          # Added
    department = data.get('department', '').strip()  # Added

    # 1. Validation
    if not any(email.endswith(f"@{domain}") for domain in DOMAIN_WHITELIST):
        return jsonify({"message": f"Registration restricted to {DOMAIN_WHITELIST} domains only"}), 403
    
    if len(student_id) != 10 or not student_id.isdigit():
        return jsonify({"message": "Use a valid 10-digit ID"}), 400

    # 2. Check if user already exists
    existing_user = User.query.filter((User.email == email) | (User.student_id == student_id)).first()
    if existing_user:
        if existing_user.is_verified:
            return jsonify({"message": "Account already registered & verified. Please login."}), 400
        else:
            # Update incomplete registration details if needed
            existing_user.course = course
            existing_user.department = department
            db.session.commit()

    # 3. Generate & Store/Update User (Unverified)
    if not existing_user:
        new_user = User(email=email, student_id=student_id, course=course, department=department)
        db.session.add(new_user)
        db.session.commit()

    # 4. Generate OTP
    otp = generate_otp()
    hashed = hash_otp(otp)
    expiry_time = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    # 5. Store OTP Logic
    token = Token.query.filter_by(email=email).first()
    if token:
        # Check cooldown
        if (datetime.utcnow() - token.last_resend).total_seconds() < OTP_COOLDOWN_SECONDS:
             return jsonify({
                 "message": f"Please wait {OTP_COOLDOWN_SECONDS}s before resending OTP", 
                 "cooldown": True,
                 "retry_after": datetime.timestamp(token.last_resend) + OTP_COOLDOWN_SECONDS
             }), 429
        
        # Max resend check (reset if expired)
        if token.resend_count >= MAX_RESEND_ATTEMPTS and token.expiry > datetime.utcnow():
             return jsonify({"message": "Max OTP attempts reached. Try again later."}), 429
             
        token.otp_hash = hashed
        token.expiry = expiry_time
        token.resend_count += 1
        token.last_resend = datetime.utcnow()
    else:
        token = Token(email=email, otp_hash=hashed, expiry=expiry_time, resend_count=0)
        db.session.add(token)

    db.session.commit()

    # 6. Send Email
    try:
        msg = Message("Your Verification Code - UniGrievance", recipients=[email])
        msg.body = f"Your Verification Code is: {otp}\n\nValid for {OTP_EXPIRY_MINUTES} minutes.\nDo not share this with anyone."
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")
        return jsonify({"message": "OTP Sent (check email or spam)", "dev_otp": otp}), 200

    return jsonify({"message": "OTP sent to your email!"}), 200


@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email', '').strip().lower()
    otp_input = data.get('otp', '').strip()

    token = Token.query.filter_by(email=email).first()
    
    if not token:
        return jsonify({"message": "No pending verification found"}), 404
        
    if datetime.utcnow() > token.expiry:
        return jsonify({"message": "OTP Expired. Please Request New."}), 400
        
    if not check_otp(otp_input, token.otp_hash):
        return jsonify({"message": "Invalid OTP"}), 401

    # Success: verify user
    user = User.query.filter_by(email=email).first()
    if user:
        user.is_verified = True
        db.session.commit()
    
    # Clear OTP
    db.session.delete(token)
    db.session.commit()

    return jsonify({"message": "Verification Successful!", "verified": True}), 200


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email_or_id = data.get('login_id', '').strip()
    
    # If using ID
    user = User.query.filter((User.email == email_or_id) | (User.student_id == email_or_id)).first()
    
    if not user:
        return jsonify({"message": "User not found. Please register."}), 404
        
    if not user.is_verified:
         return jsonify({"message": "Account not verified. Please complete verification."}), 403

    return jsonify({
        "message": "Login successful",
        "user": {
            "email": user.email,
            "id": user.student_id,
            "role": "student",
            "name": user.email.split('@')[0],
            "course": user.course,          # Added
            "department": user.department   # Added
        }
    }), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
