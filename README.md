# Amu Nex.us — Frontend

![Vite](https://img.shields.io/badge/Vite-%E2%9A%A1%EF%B8%8F-646CFF?style=flat-square&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwindcss)

Lightweight, production-ready React frontend built with Vite, TypeScript, Tailwind and shadcn-ui for a clean, role-based university club dashboard.

## Key points
- Modern stack: Vite + React + TypeScript + TailwindCSS + shadcn-ui
- Role-based UI patterns (student, club-admin, super-user)
- Designed to integrate with a JWT-protected backend (see BACKEND_API_ENDPOINTS.md)
- Fast dev refresh and small production bundles

## Quick start
1. Install
```bash
git clone https://github.com/Yobil-Job/Amu_Nex.us_frontend.git
cd Amu_Nex.us_frontend
npm ci
```
2. Dev
```bash
npm run dev
# open http://localhost:5173
```
3. Build
```bash
npm run build
npm run preview
```

## Env
Copy `.env.example` → `.env` and set API_BASE and Cloudinary keys as needed. See CLOUDINARY_SETUP.md for media uploads.

## Deployment
Ready for Vercel/Netlify or any static host that supports Vite builds. Use the production build output in `dist/`.

## Useful docs in repo
- BACKEND_API_ENDPOINTS.md — backend routes & payloads
- ROLE_BASED_UI_STRUCTURE.md — UI access patterns by role
- Several fix/plan docs for dashboard & data fetching groups

## Contact
Eyob Weldetensay — https://github.com/Yobil-Job — https://www.linkedin.com/in/eyob-weldetensay-a68160254/
