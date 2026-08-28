# Spline Fitness

A workout tracking app with an integrated blog, built with Next.js 16.

## Features

- **Circuit Training**: Timed combos with rounds, audio cues, and load metrics
- **Traditional Workouts**: Sets, reps, and weight tracking
- **Frontier Cards**: Location-based pocket cards that retain only exercise frontiers
- **Workout Calendar**: Review, edit, and manage saved workouts by date
- **1-on-1 Booking**: Cal.com integration for personal training sessions
- **Blog**: MDX-powered blog for fitness content

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix primitives)
- **Database**: Cloud Firestore
- **Auth**: Firebase Authentication with Google sign-in
- **Blog**: MDX with gray-matter frontmatter

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Optional Firebase Environment Overrides

The public Firebase web configuration for the production project is included in
`src/lib/firebase.ts`. To point a local build at a different Firebase project,
create `.env.local` with:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Project Structure

```
src/
├── app/
│   ├── blog/                 # Blog routes
│   │   ├── page.tsx          # Blog listing
│   │   └── [slug]/page.tsx   # Individual posts
│   └── page.tsx              # Home page
├── components/
│   ├── blog/                 # Blog components
│   ├── circuit/              # Circuit workout UI
│   ├── traditional/          # Traditional workout UI
│   ├── calendar/             # Workout calendar
│   ├── booking/              # Cal.com booking
│   ├── shared/               # Shared components
│   └── ui/                   # shadcn/ui components
├── content/
│   └── posts/                # Blog posts (MDX)
├── data/                     # Workout definitions
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities (Firebase, storage, blog helpers)
└── types/                    # TypeScript definitions
```

## Blog

### Adding a New Post

Create a `.mdx` file in `src/content/posts/`:

```mdx
---
title: "Your Post Title"
description: "Brief description for SEO and previews"
date: "2024-12-02"
author: "Your Name"
---

# Your Post Title

Write your content here using Markdown...
```

### Adding Images

Place images in `public/blog/images/` and reference them:

```mdx
![Alt text](/blog/images/your-image.jpg)
```

### Embedding YouTube Videos

Use the `YouTube` component with the video ID (the part after `v=` in the URL):

```mdx
<YouTube id="dQw4w9WgXcQ" />
```

With a custom title for accessibility:

```mdx
<YouTube id="dQw4w9WgXcQ" title="My workout tutorial" />
```

### Frontmatter Options

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `description` | Yes | SEO description |
| `date` | Yes | Publication date (YYYY-MM-DD) |
| `author` | Yes | Author name |
| `draft` | No | Set `true` to hide from listing |
| `categories` | No | Array of categories (future) |
| `tags` | No | Array of tags (future) |

## Firebase Setup

1. Create a Firebase project and register a web app.
2. Enable Google in **Authentication → Sign-in method**.
3. Create the default Cloud Firestore database in production mode.
4. Add the public web app configuration to `src/lib/firebase.ts`, or provide it
   through the optional `NEXT_PUBLIC_FIREBASE_*` environment overrides.
5. Authenticate the Firebase CLI and deploy the rules and indexes:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore
   ```

Workout sessions are JSON-like documents stored under
`users/{userId}/workouts/{workoutId}`. Exercise preferences are stored under
`users/{userId}/exercisePreferences/{exerciseId}`. Frontier Cards are stored under
`users/{userId}/frontierCards/{cardId}`. The rules in
`firestore.rules` restrict these collections to their authenticated owner.

## Design Assets

Logo source files are in `design/`:
- `muscle-logo.R` - R script that generates the Spline Fitness logo

## Deployment

Deploy on [Vercel](https://vercel.com):

```bash
npm run build
```

The blog uses static generation - all posts are pre-built at deploy time.
