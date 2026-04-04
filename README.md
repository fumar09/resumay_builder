# ResuMay!

ResuMay! is an ATS resume optimization app built with React, TypeScript, and Vite.

It combines three things in one workflow:

- A guided resume builder
- ATS-style job description matching
- A live optimized resume preview with PDF export

## What It Does

- Paste a target job description and role
- Build or edit your resume directly in the app
- Surface matched and missing keywords from the target job
- Generate a stronger ATS-focused summary suggestion
- Refine experience bullets into clearer recruiter-friendly language
- Preview the optimized version instantly
- Save your workspace locally in the browser
- Export the optimized resume as a PDF

## Product Direction

This version of ResuMay! is designed more like a high-conversion ATS optimization product than a generic form-only builder.

It keeps the app:

- Job-targeted
- Role-flexible
- Conversion-focused
- Local-first
- Built for modern online job boards
- Ready for shared user reviews

## Getting Started

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`
3. Open `http://localhost:5173`

## Usage Flow

1. Enter your target role and paste the job description
2. Fill in your resume basics, experience, skills, and supporting sections
3. Review the live ATS score, keyword coverage, summary suggestion, and refined bullets
4. Toggle the optimized version on and export the final PDF

## Tech

- React 18
- TypeScript
- Vite
- jsPDF
- html2canvas
- Bootstrap Icons

## Deployment

ResuMay! now supports two review modes:

- Static mode: the app still works as a frontend-only deploy, and review submissions stay local to the user's device
- Shared review mode: when deployed on Vercel with Blob storage configured, approved reviews are loaded from a shared backend and new submissions publish directly to the public wall

### Shared Review Backend

ResuMay! includes a Vercel Function under `api/` for shared reviews:

- `GET /api/reviews`
  Returns approved public reviews
- `POST /api/reviews`
  Accepts a new review and publishes it to the shared review wall

### Environment Variables

Copy [.env.example](/c:/Resume_Builder/.env.example) to a local `.env.local` or configure the same values in Vercel:

- `BLOB_READ_WRITE_TOKEN`
  Required to enable the shared review backend

### Local Development Note

`npm run dev` serves the Vite frontend only. For shared review APIs, run the project through Vercel's local runtime. If the API is unavailable, the app falls back to local review storage so the submission UX still works.
