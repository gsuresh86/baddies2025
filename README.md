# PBEL City Badminton Tournament 2025

A comprehensive web application for managing and displaying information about the PBEL City Badminton Tournament 2025.

## Features

- **Tournament Management**: Complete tournament administration system
- **Player Registration**: Online registration with category management
- **Match Scheduling**: Automated match generation and scheduling
- **Live Scoring**: Real-time match updates and live scoring
- **Team Management**: Random team assignment and pool management
- **Results & Standings**: Dynamic standings and results display
- **Video Gallery**: Tournament highlights and match coverage
- **Responsive Design**: Mobile-friendly interface

## Video Gallery Setup

The video gallery displays manually curated tournament videos and highlights:

1. **Add Videos**: Edit `src/lib/videoData.ts` to add your video URLs
2. **Video Format**: Use the `addVideo()` helper function:
   ```typescript
   const newVideo = addVideo(
     'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
     'Your Video Title',
     'Your video description',
     '2025-01-20',
     '5:30',
     '1.5K'
   );
   ```
3. **Features**:
   - Displays video thumbnails with duration and view counts
   - Click to play videos in a modal
   - Responsive grid layout
   - Direct link to YouTube channel

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.local.template` to `.env.local` and configure your environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required environment variables (see `env.local.template` for details):
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── fixtures/          # Tournament fixtures
│   ├── matches/           # Match details and live scoring
│   ├── standings/         # Tournament standings
│   └── teams/             # Team information
├── components/            # Reusable components
├── contexts/              # React contexts
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
