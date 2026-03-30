# ResumeForge

ResumeForge is a free, no-login ATS resume optimization app built with React, TypeScript, and Vite.

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

This version of ResumeForge is designed more like an ATS optimization product than a generic form-only builder.

It keeps the app:

- Free
- No-credit
- No-subscription
- No-login
- Local-first

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

This is still a static frontend app and can be deployed to services like Vercel, Netlify, or GitHub Pages.
