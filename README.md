# Adv. Priyanka — 3D Advocate Portfolio

Responsive advocate portfolio built with HTML, CSS, JavaScript, Three.js and PHP.
When a visitor submits the **consultation request** form, the details are **emailed to priyankaladvocate@gmail.com**
and the visitor sees a "Request sent!" confirmation. (No database, admin panel or tracking page is used.)

## One-time email setup (required)
Gmail will not accept a normal password from a website, so create an **App password**:
1. Sign in to the Gmail account `priyankaladvocate@gmail.com` → **Manage your Google Account → Security**.
2. Turn **2-Step Verification ON** (needed for App passwords).
3. Search "App passwords" in the Google Account page → create one (name: `Advocate website`) → copy the 16-character code.
4. Open `api/config.php` and paste it here:
   ```php
   const SMTP_PASS = 'abcd efgh ijkl mnop';
   ```
5. Save. That's all — no MySQL needed.

## Run locally with XAMPP
1. Extract the folder into `C:\xampp\htdocs\advocate_3d_portfolio`.
2. Start **Apache** only in the XAMPP Control Panel.
3. Open `http://localhost/advocate_3d_portfolio/` (do not double-click `index.html`).
4. Fill the form and submit. Check the Gmail inbox of priyankaladvocate@gmail.com (also look in Spam the first time).

Without Apache, from CMD: `cd C:\xampp\htdocs\advocate_3d_portfolio` then `C:\xampp\php\php.exe -S localhost:8000` and open `http://localhost:8000/`.

## What the email looks like
Subject: `New consultation request: <name> – <practice area>` with name, phone, email, practice area, preferred date/time and note.
**Reply** to the email answers the client directly (Reply-To is the client's email).

## Troubleshooting (when testing on localhost the exact error is shown under the form)
- **"SMTP_PASS is empty"** – paste the App password in `api/config.php`.
- **"Gmail rejected the login"** – wrong App password, or 2-Step Verification is off.
- **Certificate / TLS error on XAMPP** – set `SMTP_VERIFY_TLS` to `false` in `api/config.php`.
- **"Cannot connect to tcp://smtp.gmail.com:587"** – no internet, or a firewall/antivirus blocks port 587. Try `SMTP_PORT = 465` and `SMTP_SECURE = 'ssl'`.
- **Could not connect to the PHP backend** – open the site through `http://localhost/...`, not as a file.
- **On live hosting**, the server must allow outgoing connections to `smtp.gmail.com`.

## Note
Requests are only emailed, they are not stored anywhere. If the email fails, the visitor sees an error and nothing is saved,
so test it once after setting the App password. Add verified office address / contact details in the `CONTACT` object in `assets/js/main.js`.

## Structure
```text
advocate_3d_portfolio/
├── index.html
├── README.md
├── api/
│   ├── config.php     (email settings + SMTP sender)
│   └── bookings.php   (validates the form and sends the email)
└── assets/ (css, js, img, video)
```
