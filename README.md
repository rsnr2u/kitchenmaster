# 🍳 KitchenMaster

KitchenMaster is a modern, AI-powered recipe and culinary platform built with a premium editorial aesthetic. It delivers authentic step-by-step cooking instructions with built-in multilingual support, smart serving size scaling, and intelligent brand monetization.

## 🌟 Key Features

- **AI Chef Gateway:** Generate bespoke recipes dynamically using Google Gemini AI integrations.
- **Multilingual Native Engine:** Seamless on-the-fly translation between English and Telugu without losing recipe context.
- **Automated Brand Ad Engine:** Dynamically parse recipe ingredients to inject targeted sponsor logos and affiliate links based on admin-defined keyword rules.
- **Dynamic SEO Sitemap:** Automatic XML generation natively rendering active Supabase recipes for Google Search Console indexing.
- **Premium Admin Dashboard:**
  - Secure, server-side admin authentication (`SUPABASE_SERVICE_ROLE_KEY`).
  - **Metrics Dashboard:** Track total recipes, user cooking activity, and API efficiency.
  - **User Management:** Monitor active user sign-ins, history, and destructive account deletion limits.
  - **Brand Sponsorships:** Live-edit ad insertion rules.
  - **Global Settings:** Modify site names, SEO configurations, and trigger Maintenance Mode instantly.

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Actions, ISR, Server Components)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth.admin)
- **Styling:** Tailwind CSS (Custom color tokens: Warm Cream, Deep Cacao, Amber-Orange)
- **AI Integration:** Google Gemini API
- **Deployment:** Optimized for Vercel

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rsnr2u/kitchenmaster.git
   cd kitchenmaster
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   # Supabase Public Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Supabase Secure Admin 
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Integrations
   GEMINI_API_KEY=your_google_gemini_api_key
   
   # Site URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔒 Security Notes

- The Admin Panel (`/admin/*`) is strictly guarded by server-side middleware and layout checks. Only the designated root email (e.g., `rsnr4u@gmail.com`) is permitted access.
- Secret `.env.local` keys are strictly ignored by `.gitignore` to prevent leakage into the repository. 

---
*Built for the modern epicurean.*
