# Jober

**Jober System** is a job-finding app that connects job seekers with recruiters. It helps people find jobs easily, helps companies hire the right employees faster.

📌 **Note:** This project was developed as a final-year academic project at the **Royal University of Phnom Penh (RUPP)**.

## Features

🖥️ 1. Admin UI

- User Management: Add, update, delete, and manage user accounts.
- Job Post Approval: Review and approve job postings from companies.
- Statistics Dashboard: View charts and data (e.g., daily new user sign-ups).
- Content Management: Manage job categories and locations.

⚙️ 2. Backend & API

- RESTful API: Organized and structured API endpoints for the whole system.
- Secure Auth: Secure Login/Signup using JWT or Firebase Auth.
- File Upload: Supports uploading profile images and CV files.
- Advanced Search: Logic for filtering jobs by title, category, or location.

### Project Structure (High Level)
```
jober-backend/
    ├── prisma/
    │   ├── migrations/
    │   ├── seed.ts
    ├── public/
    ├── src/
    │   ├── app/
    │   │   ├── (protect)/
    │   │   ├── api/
    │   │   ├── generated/
    │   │   │   └── prisma/
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   ├── components/
    │   │   ├── ui/
    │   ├── hooks/
    │   │   ├── use-mobile.ts
    │   ├── lib/
    │   ├── shared/
    │   │   └── config/
    │   ├── types/
    │   └── proxy.ts
    ├── .gitignore
    ├── components.json
    ├── env_example
    ├── eslint.config.mjs
    ├── instrumentation.ts
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── prisma.config.ts
    ├── README.md
    └── tsconfig.json
```
### System Architecture
![alt text](https://res.cloudinary.com/dom2ezax7/image/upload/v1774338564/jober_-_architrcture_uyqykf.png)