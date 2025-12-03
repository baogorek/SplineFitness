# Spline Fitness

A workout tracking app with an integrated blog, built with Next.js 16.

## Features

- **Circuit Training**: Timed combos with rounds, audio cues, and load metrics
- **Traditional Workouts**: Sets, reps, and weight tracking
- **Workout History**: Calendar view of past workouts
- **1-on-1 Booking**: Cal.com integration for personal training sessions
- **Blog**: MDX-powered blog for fitness content

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix primitives)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Google OAuth
- **Blog**: MDX with gray-matter frontmatter

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
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
│   ├── calendar/             # History calendar
│   ├── booking/              # Cal.com booking
│   ├── shared/               # Shared components
│   └── ui/                   # shadcn/ui components
├── content/
│   └── posts/                # Blog posts (MDX)
├── data/                     # Workout definitions
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities (Supabase, blog helpers)
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

## Database Schema

Table: `workout_sessions`
- `id`: UUID primary key
- `user_id`: UUID (references auth.users)
- `mode`: 'circuit' | 'traditional'
- `workout_id`: string
- `variant`: 'A' | 'B'
- `started_at`: timestamp
- `completed_at`: timestamp
- `data`: JSONB (rounds/exercises data)

RLS policies ensure users can only access their own workouts. See `supabase/schema.sql` for full schema.

## Design Assets

Logo source files are in `design/`:
- `muscle-logo.R` - R script that generates the Spline Fitness logo

## Deployment

Deploy on [Vercel](https://vercel.com):

```bash
npm run build
```

The blog uses static generation - all posts are pre-built at deploy time.
