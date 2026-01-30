import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { companyName, companyDescription, companyLocation } = req.body;
  const userId = req.headers['x-user-id'] as string; // pass userId in headers

  if (!userId || !companyName) return res.status(400).json({ error: 'Missing fields' });

  const { error } = await supabase.from('employers').insert({
    id: userId,
    company_name: companyName,
    company_description: companyDescription,
    company_location: companyLocation,
  });

  if (error) return res.status(500).json({ error });

  res.status(200).json({ success: true });
}
