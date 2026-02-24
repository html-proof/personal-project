# 🎓 Personal Notes Platform

A modern, centralized e-learning repository built for the Notes . This platform streamlines academic resource sharing between faculty and students with a premium, engaging user experience.

![Project Banner](https://via.placeholder.com/1200x400?text=CEP+Notes+Platform) 
*(Note: Replace with actual screenshot)*

## ✨ Key Features

- **🚀 Public Resource Browser**: Fast, drill-down navigation (Dept → Semester → Subject → Notes) without login.
- **🔐 Teacher Dashboard**: Secure area for faculty to manage the curriculum structure and upload materials.
- **🛡️ Secure Authentication**: Powered by Firebase Auth with strict email verification.
- **🎨 Premium UI/UX**: Glassmorphism aesthetic, dark/light mode, and smooth animations.
- **⚡ Performance**: Built on Next.js 14 App Router for blazing fast static and dynamic rendering.
- **📱 Responsive**: Fully optimized for mobile, tablet, and desktop devices.

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (React)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Modern CSS Modules with CSS Variables
- **Backend / Database**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project setup with Auth, Firestore, and Storage enabled.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/html-proof/personal-project.git
   cd personal-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Supabase Keep-Alive (GitHub Actions)

If your Supabase free project sleeps during low traffic, configure these repository secrets to keep it warm via `.github/workflows/supabase-keepalive.yml`:

- `SUPABASE_URL` (example: `https://your-project-ref.supabase.co`)
- `SUPABASE_ANON_KEY` (anon key from Supabase API settings)

## 📂 Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── auth/          # Login, Signup, Verify Email
│   ├── dashboard/     # Protected Teacher routes
│   └── page.tsx       # Landing page
├── components/        # Reusable UI components
│   ├── dashboard/     # Admin-specific components
│   ├── layout/        # Navbar, Footer
│   └── public/        # Public-facing components (NotesBrowser)
├── lib/               # Utilities & Config
│   └── firebase/      # Firebase initialization & helper functions
└── context/           # React Context (Theme, etc.)
```

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for CEP Poonjar
</p>
