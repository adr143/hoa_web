import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { homeLocation, travelDistance, selectedCategories } = req.body;
  const userId = req.headers['x-user-id'] as string;

  if (!userId) return res.status(400).json({ error: 'Missing user id' });

  const { error } = await supabase.from('workers').insert({
    id: userId,
    home_location: homeLocation,
    travel_distance: travelDistance,
    category: selectedCategories[0] || null, // you can adjust for multiple categories
  });

  if (error) return res.status(500).json({ error });

  res.status(200).json({ success: true });
}
