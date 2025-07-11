-- Match History and Media Database Schema Updates

-- 1. Update matches table to include more detailed information
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_notes TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_highlights TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_duration INTEGER; -- in minutes
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_venue VARCHAR(255);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_officials TEXT[]; -- array of official names

-- 2. Create match_history table for detailed match records
CREATE TABLE IF NOT EXISTS match_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5 for team matches
    team1_score INTEGER,
    team2_score INTEGER,
    winner VARCHAR(10), -- 'team1', 'team2', 'draw'
    game_duration INTEGER, -- in minutes
    game_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create match_media table for photos and videos
CREATE TABLE IF NOT EXISTS match_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video')),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by_user_id UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create match_highlights table for key moments
CREATE TABLE IF NOT EXISTS match_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    highlight_type VARCHAR(50) NOT NULL, -- 'game_winner', 'amazing_rally', 'match_point', etc.
    description TEXT,
    timestamp INTEGER, -- seconds from match start
    media_id UUID REFERENCES match_media(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_history_match_id ON match_history(match_id);
CREATE INDEX IF NOT EXISTS idx_match_media_match_id ON match_media(match_id);
CREATE INDEX IF NOT EXISTS idx_match_media_public ON match_media(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_match_highlights_match_id ON match_highlights(match_id);

-- 6. Add RLS policies for match_media
ALTER TABLE match_media ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read public media
CREATE POLICY "Allow read public media" ON match_media
    FOR SELECT USING (is_public = true);

-- Allow authenticated users to upload media
CREATE POLICY "Allow upload media" ON match_media
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own uploads
CREATE POLICY "Allow update own media" ON match_media
    FOR UPDATE USING (auth.uid() = uploaded_by_user_id);

-- Allow users to delete their own uploads
CREATE POLICY "Allow delete own media" ON match_media
    FOR DELETE USING (auth.uid() = uploaded_by_user_id);

-- 7. Add RLS policies for match_history
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read match history
CREATE POLICY "Allow read match history" ON match_history
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert match history
CREATE POLICY "Allow insert match history" ON match_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Add RLS policies for match_highlights
ALTER TABLE match_highlights ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read highlights
CREATE POLICY "Allow read highlights" ON match_highlights
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert highlights
CREATE POLICY "Allow insert highlights" ON match_highlights
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 