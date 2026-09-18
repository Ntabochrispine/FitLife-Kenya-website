# FitLife-Kenya-website
FitLife Kenya is a fitness and wellness platform that helps people improve their physical health through workout programs, personal training, nutrition guidance, and fitness plans.
The website was task 3 of the InAmigos 2 weeks internship, whereby we were required to create a complete website using AI tools for any domain (business, NGO, portfolio, education, etc.)
The main aim was to use any AI website generator to build a website with multiple sections like homepage, about, and services. Focus on structure and idea rather than perfection.
The main objective of the task was to explore AI-powered website creation and understand its practical use.

# FitLife Kenya — Full-Stack Website

A full-stack fitness and wellness website prototype for the AI website creation assignment.

## Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite using better-sqlite3
- Authentication: bcrypt password hashing + JWT
- API: REST endpoints

## Backend features

### Public
- `GET /api/health`
- `GET /api/programs`
- `POST /api/contact`

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`

### Logged-in member
- `POST /api/memberships`
- `GET /api/memberships`
- `POST /api/program-requests`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/contacts`

The admin endpoints require a user whose `role` is `admin`. For a classroom/demo project, an administrator can be created by updating a user's role in the SQLite database.

## Run the website

Install Node.js (LTS recommended), then open this project folder in a terminal:

```bash
npm install
npm start
```

Open:

`http://localhost:3000`

For development:

```bash
npm run dev
```

The database is automatically created at:

`server/data/fitlife.db`

## Important security notes

This is a student/demo prototype. Before production deployment:

1. Set a strong random `JWT_SECRET` environment variable.
2. Use HTTPS.
3. Add rate limiting and request validation.
4. Add CSRF/CORS policy appropriate for the deployment.
5. Add email verification/password reset.
6. Add proper admin-management workflows.
7. Never commit secrets or the SQLite database containing real user data.
8. Replace sample contact information, testimonials, prices and statistics.

## GitHub Pages note

GitHub Pages only hosts the static frontend; it does not run the Node.js/Express backend. To deploy the full-stack version, host the frontend and backend on a service that supports Node.js (or deploy the backend separately), then configure the frontend API URL accordingly.

For the assignment, the easiest demonstration is to run the full-stack project locally with `npm install` and `npm start`.

