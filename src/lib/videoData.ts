// Manual video data - Real tournament videos from @kadapaammayi channel
export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  videoUrl: string;
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

// Generate thumbnail URL from video ID
function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Real tournament videos from the channel
export const tournamentVideos: VideoItem[] = [
  {
    id: 'YpS741VXelk',
    title: 'Men\'s team #singles #Smashhawks Yagnanand Vs #RallyAcers Sonu #retiredhurt #pbelcitybt2025',
    description: 'Men\'s team singles match between Smashhawks Yagnanand and RallyAcers Sonu',
    thumbnail: getThumbnailUrl('YpS741VXelk'),
    publishedAt: '2025-01-15',
    duration: '20:15',
    viewCount: '2.1K',
    videoUrl: 'https://www.youtube.com/watch?v=YpS741VXelk'
  },
  {
    id: 'M36RV3r4EUU',
    title: 'Balu & Chris Vs Srinivas Reddy & Tanvisri #mixeddoubles #pbelcitybt2025 #badmintonmatch',
    description: 'Mixed doubles match featuring Balu & Chris vs Srinivas Reddy & Tanvisri',
    thumbnail: getThumbnailUrl('M36RV3r4EUU'),
    publishedAt: '2025-01-14',
    duration: '15:30',
    viewCount: '1.8K',
    videoUrl: 'https://www.youtube.com/watch?v=M36RV3r4EUU'
  },
  {
    id: 'euIp2eskyuQ',
    title: 'Balu & Chris Vs Sunitha & Sanjay #mixeddoubles #pbelcitybt2025 #badmintonmatch',
    description: 'Mixed doubles match featuring Balu & Chris vs Sunitha & Sanjay',
    thumbnail: getThumbnailUrl('euIp2eskyuQ'),
    publishedAt: '2025-01-13',
    duration: '5:45',
    viewCount: '1.5K',
    videoUrl: 'https://www.youtube.com/watch?v=euIp2eskyuQ'
  },
  {
    id: 'JGEr74gC1aA',
    title: 'Boys under 13 #pbelcitybt2025 #badmintonmatch',
    description: 'Boys under 13 category match highlights',
    thumbnail: getThumbnailUrl('JGEr74gC1aA'),
    publishedAt: '2025-01-12',
    duration: '8:20',
    viewCount: '1.2K',
    videoUrl: 'https://www.youtube.com/watch?v=JGEr74gC1aA'
  },
  {
    id: 'bYQ7kYIBqOM',
    title: 'Family Mixed Doubles Shraveen & Dhruthi Vs Shubham & Arushi #pbelcitybt2025 #badmintonmatch',
    description: 'Family mixed doubles match featuring Shraveen & Dhruthi vs Shubham & Arushi',
    thumbnail: getThumbnailUrl('bYQ7kYIBqOM'),
    publishedAt: '2025-01-11',
    duration: '12:45',
    viewCount: '1.9K',
    videoUrl: 'https://www.youtube.com/watch?v=bYQ7kYIBqOM'
  },
  {
    id: 'rCqN2tiW3ZM',
    title: 'Balu & Chris Vs Sanjay & Sunitha #mixeddoubles #pbelcitybt2025 #badmintonmatch',
    description: 'Mixed doubles match featuring Balu & Chris vs Sanjay & Sunitha',
    thumbnail: getThumbnailUrl('rCqN2tiW3ZM'),
    publishedAt: '2025-01-10',
    duration: '12:30',
    viewCount: '1.6K',
    videoUrl: 'https://www.youtube.com/watch?v=rCqN2tiW3ZM'
  },
  {
    id: 'ZpFyPpNQesI',
    title: 'Balu & Chris Vs Sanjay & Sunitha #mixeddoubles #pbelcitybt2025 #badmintonmatch',
    description: 'Another mixed doubles match featuring Balu & Chris vs Sanjay & Sunitha',
    thumbnail: getThumbnailUrl('ZpFyPpNQesI'),
    publishedAt: '2025-01-09',
    duration: '12:15',
    viewCount: '1.4K',
    videoUrl: 'https://www.youtube.com/watch?v=ZpFyPpNQesI'
  },
  {
    id: 'At1WfYaCFsU',
    title: 'Boys under18 Arnav Vs Sukeerth #pbelcitybt2025 #badmintonmatch',
    description: 'Boys under 18 singles match between Arnav and Sukeerth',
    thumbnail: getThumbnailUrl('At1WfYaCFsU'),
    publishedAt: '2025-01-08',
    duration: '7:08',
    viewCount: '1.1K',
    videoUrl: 'https://www.youtube.com/watch?v=At1WfYaCFsU'
  },
  {
    id: 'kHrRRgjMEmE',
    title: 'Boys under18 Vaishnav Vs Akshith #pbelcitybt2025 #badmintonmatch',
    description: 'Boys under 18 singles match between Vaishnav and Akshith',
    thumbnail: getThumbnailUrl('kHrRRgjMEmE'),
    publishedAt: '2025-01-07',
    duration: '3:43',
    viewCount: '900',
    videoUrl: 'https://www.youtube.com/watch?v=kHrRRgjMEmE'
  },
  {
    id: 'ch5a7E0NEkw',
    title: 'A small clip of boys under18 Joseph Vs Jeshua #pbelcitybt2025',
    description: 'Short clip from boys under 18 match between Joseph and Jeshua',
    thumbnail: getThumbnailUrl('ch5a7E0NEkw'),
    publishedAt: '2025-01-06',
    duration: '2:47',
    viewCount: '750',
    videoUrl: 'https://www.youtube.com/watch?v=ch5a7E0NEkw'
  },
  {
    id: '2wSyhgumjB4',
    title: 'Boys under13 Darshith Vs Vishnu #pbelcitybt2025',
    description: 'Boys under 13 singles match between Darshith and Vishnu',
    thumbnail: getThumbnailUrl('2wSyhgumjB4'),
    publishedAt: '2025-01-05',
    duration: '2:21',
    viewCount: '800',
    videoUrl: 'https://www.youtube.com/watch?v=2wSyhgumjB4'
  },
  {
    id: 'U4UvDu4oXDg',
    title: 'Kids under13 Shivam Vs Arjun #pbelcitybt2025 #badmintonmatch',
    description: 'Kids under 13 singles match between Shivam and Arjun',
    thumbnail: getThumbnailUrl('U4UvDu4oXDg'),
    publishedAt: '2025-01-04',
    duration: '8:20',
    viewCount: '1.0K',
    videoUrl: 'https://www.youtube.com/watch?v=U4UvDu4oXDg'
  },
  {
    id: '_I9jl10K7wk',
    title: '#mensteam #rallyacers Praveen & SaiRamesh Vs #Smashhawks Shashikanth & Vamsi #pbelcitybt2025',
    description: 'Men\'s team doubles match between Rallyacers and Smashhawks',
    thumbnail: getThumbnailUrl('_I9jl10K7wk'),
    publishedAt: '2025-01-03',
    duration: '15:30',
    viewCount: '2.3K',
    videoUrl: 'https://www.youtube.com/watch?v=_I9jl10K7wk'
  },
  {
    id: 'LsiY5sfWtP8',
    title: 'Men\'s team #singles #Rallyacers SaiRamesh Vs #SmashHawks Shashikanth #pbelcitybt2025 #badmintonmatch',
    description: 'Men\'s team singles match between Rallyacers SaiRamesh and SmashHawks Shashikanth',
    thumbnail: getThumbnailUrl('LsiY5sfWtP8'),
    publishedAt: '2025-01-02',
    duration: '12:45',
    viewCount: '2.0K',
    videoUrl: 'https://www.youtube.com/watch?v=LsiY5sfWtP8'
  },
  {
    id: '_stiQ-z2lIc',
    title: 'A small video of men\'s team #pbelcitybt2025',
    description: 'Short highlights video of men\'s team matches',
    thumbnail: getThumbnailUrl('_stiQ-z2lIc'),
    publishedAt: '2025-01-01',
    duration: '3:05',
    viewCount: '1.2K',
    videoUrl: 'https://www.youtube.com/watch?v=_stiQ-z2lIc'
  },
  {
    id: '5NknnDuevWs',
    title: '#Men\'steam #Smashhawks Yagnanand & Vamsi Vs Daniel Rallyacers #pbelcitybt2025 #doubles #badminton',
    description: 'Men\'s team doubles match featuring Smashhawks Yagnanand & Vamsi vs Daniel Rallyacers',
    thumbnail: getThumbnailUrl('5NknnDuevWs'),
    publishedAt: '2024-12-31',
    duration: '18:30',
    viewCount: '2.5K',
    videoUrl: 'https://www.youtube.com/watch?v=5NknnDuevWs'
  },
  {
    id: 'BRN7p6Mqriw',
    title: '#Men\'s team #singles #Courtkings Bhupinder Vs #raptors Joydeep #pbelcitybt2025 #badmintonmatch',
    description: 'Men\'s team singles match between Courtkings Bhupinder and Raptors Joydeep',
    thumbnail: getThumbnailUrl('BRN7p6Mqriw'),
    publishedAt: '2024-12-30',
    duration: '14:20',
    viewCount: '1.8K',
    videoUrl: 'https://www.youtube.com/watch?v=BRN7p6Mqriw'
  },
  {
    id: 'eKsN-8bRw48',
    title: 'Court kings Sumit & Idrees Vs Raptors Ajay & Joydeep #mensteam #pbelcitybt2025 #badmintonmatch',
    description: 'Men\'s team doubles match between Court kings and Raptors',
    thumbnail: getThumbnailUrl('eKsN-8bRw48'),
    publishedAt: '2024-12-29',
    duration: '16:45',
    viewCount: '2.1K',
    videoUrl: 'https://www.youtube.com/watch?v=eKsN-8bRw48'
  },
  {
    id: 'QBsBzSwoNK0',
    title: 'Swathi vs Priya Womens Singles #badmintonmatch #pbelcitybt2025',
    description: 'Women\'s singles match between Swathi and Priya',
    thumbnail: getThumbnailUrl('QBsBzSwoNK0'),
    publishedAt: '2024-12-28',
    duration: '10:37',
    viewCount: '1.6K',
    videoUrl: 'https://www.youtube.com/watch?v=QBsBzSwoNK0'
  },
  {
    id: 'z8zs3ukIIgI',
    title: 'Mens team doubles #pbelcitybt2025 #badmintonmatch',
    description: 'Men\'s team doubles match highlights',
    thumbnail: getThumbnailUrl('z8zs3ukIIgI'),
    publishedAt: '2024-12-27',
    duration: '11:13',
    viewCount: '1.9K',
    videoUrl: 'https://www.youtube.com/watch?v=z8zs3ukIIgI'
  }
];

// Helper function to add new videos
export function addVideo(url: string, title: string, description: string, publishedAt: string, duration: string, viewCount: string): VideoItem {
  const videoId = extractVideoId(url);
  return {
    id: videoId,
    title,
    description,
    thumbnail: getThumbnailUrl(videoId),
    publishedAt,
    duration,
    viewCount,
    videoUrl: url
  };
}

// To add more videos from the channel, use this format:
// const newVideo = addVideo(
//   'https://www.youtube.com/watch?v=NEW_VIDEO_ID',
//   'Video Title',
//   'Video description',
//   '2025-01-20',
//   '5:30',
//   '1.5K'
// );
// tournamentVideos.unshift(newVideo); // Add to beginning of array 