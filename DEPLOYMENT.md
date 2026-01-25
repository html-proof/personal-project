# 🚀 Deployment Guide: Vercel

Since your project is already pushed to GitHub, deploying to Vercel is very easy.

## ✅ Step 1: Import Project

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Click **"Continue with GitHub"**.
3. You should see your repository `CEP-POONJAR-Notes` in the list. Click **"Import"**.

## ✅ Step 2: Configure Project

1. **Framework Preset**: It should automatically detect **Next.js**.
2. **Root Directory**: Leave as `./`.
3. **Build Command**: Leave default (`next build`).

## ⚠️ Step 3: Environment Variables (CRITICAL)

Your app uses Firebase, so you MUST add your environment variables to Vercel. Vercel cannot read your local `.env.local` file.

Expand the **"Environment Variables"** section and add these (copy the values from your local `.env.local`):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | *(Your API Key)* |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | *(Your Auth Domain)* |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | *(Your Project ID)* |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | *(Your Storage Bucket)* |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | *(Your Sender ID)* |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | *(Your App ID)* |

## ✅ Step 4: Deploy

1. Click **"Deploy"**.
2. Wait a minute for the build to finish.
3. 🎉 Your site is live! You will get a URL like ``

---

## 🔄 Automatic Updates

Now that you connected GitHub to Vercel, every time you run `git push origin main`, Vercel will **automatically re-deploy** your site with the new changes!
