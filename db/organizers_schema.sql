-- Organizers Database Schema

-- Create organizers table
CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    image_url TEXT,
    image_path TEXT, -- Path in storage bucket
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default organizers data
INSERT INTO organizers (id, name, role, display_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Amit Saxena', 'Tournament Director', 1),
    ('550e8400-e29b-41d4-a716-446655440002', 'Ram Dheeraj', 'Event Coordinator', 2),
    ('550e8400-e29b-41d4-a716-446655440003', 'Sumit Khatavkar', 'Technical Director', 3),
    ('550e8400-e29b-41d4-a716-446655440004', 'Kshitij Bhargava', 'Operations Manager', 4),
    ('550e8400-e29b-41d4-a716-446655440005', 'Surya Kiran Reddy', 'Venue Coordinator', 5),
    ('550e8400-e29b-41d4-a716-446655440006', 'Kambe R Gowda', 'Player Relations', 6),
    ('550e8400-e29b-41d4-a716-446655440007', 'Kishore Babu', 'Media Coordinator', 7),
    ('550e8400-e29b-41d4-a716-446655440008', 'Saravanan M', 'Technical Support', 8),
    ('550e8400-e29b-41d4-a716-446655440009', 'Suresh', 'Logistics Manager', 9),
    ('550e8400-e29b-41d4-a716-446655440010', 'Sarada Reddy', 'Administrative Head', 10),
    ('550e8400-e29b-41d4-a716-446655440011', 'Sraveen Kuchipudi', 'Event Manager', 11),
    ('550e8400-e29b-41d4-a716-446655440012', 'Sudheer Reddy', 'Tournament Coordinator', 12),
    ('550e8400-e29b-41d4-a716-446655440013', 'Vasu Chepuru', 'Technical Manager', 13),
    ('550e8400-e29b-41d4-a716-446655440014', 'Saravanan', 'Operations Coordinator', 14),
    ('550e8400-e29b-41d4-a716-446655440015', 'Girish', 'Player Coordinator', 15)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizers_active ON organizers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizers_display_order ON organizers(display_order);

-- Enable Row Level Security
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Allow all users to read active organizers
CREATE POLICY "Allow read active organizers" ON organizers
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to update organizers
CREATE POLICY "Allow update organizers" ON organizers
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert organizers
CREATE POLICY "Allow insert organizers" ON organizers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_organizers_updated_at
    BEFORE UPDATE ON organizers
    FOR EACH ROW
    EXECUTE FUNCTION update_organizers_updated_at(); 