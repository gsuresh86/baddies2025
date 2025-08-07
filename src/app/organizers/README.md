# Organizer Upload Feature

This feature allows administrators to upload images and update roles for tournament organizers.

## Routes

- `/organizers` - Main organizers page with carousel view
- `/organizers/[id]` - Upload/edit page for specific organizer

## Features

### Authentication
- Only authenticated users (admins) can access the upload page
- Uses `AuthGuard` component for protection
- Admin status is checked on the main organizers page

### Image Upload
- Supports PNG, JPG, JPEG formats
- Maximum file size: 5MB
- Recommended size: 400x400 pixels
- Square aspect ratio preferred
- Images are stored in Supabase Storage under `public/organizers/` bucket

### Role Management
- Update organizer roles
- Role validation (max 50 characters)
- Real-time updates to database

### Database Schema

The feature uses a `organizers` table with the following structure:

```sql
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    image_url TEXT,
    image_path TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage

Images are stored in Supabase Storage with the following structure:
- Bucket: `tournament-media`
- Path: `organizers/organizer-{id}-{timestamp}.{extension}`

### API Functions

The following functions are available in `tournamentStore`:

- `getOrganizers()` - Fetch all active organizers
- `getOrganizerById(id)` - Fetch specific organizer
- `updateOrganizer(id, updates)` - Update organizer data
- `uploadOrganizerImage(organizerId, file)` - Upload organizer image

### UI Features

#### Main Organizers Page (`/organizers`)
- Carousel view of all organizers
- Auto-play functionality
- Navigation controls
- Admin edit buttons (only visible to authenticated users)
- Admin mode indicator

#### Upload Page (`/organizers/[id]`)
- Current organizer information display
- Image upload with preview
- Role update functionality
- File validation
- Loading states
- Success/error notifications

### Security

- Row Level Security (RLS) enabled on organizers table
- Only authenticated users can update organizers
- Public read access for active organizers
- File type and size validation
- Admin-only access to upload functionality

### Fallback Support

If the database is not set up, the feature falls back to static data to ensure the application continues to work.

## Setup Instructions

1. Run the database schema: `db/organizers_schema.sql`
2. Ensure Supabase Storage bucket `public` exists
3. Configure RLS policies for the organizers table
4. Set up proper authentication for admin access

## Usage

1. Navigate to `/organizers` as an admin
2. Hover over any organizer card to see the edit button
3. Click the edit button to go to the upload page
4. Upload an image and/or update the role
5. Save changes

## Error Handling

- File validation (type, size)
- Database connection errors
- Upload failures
- Authentication errors
- Network issues

All errors are displayed to the user via toast notifications. 