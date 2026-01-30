import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  onSuccess?: () => void;
}

export const CreateProposalModal = ({ isOpen, onClose, workerId, onSuccess }: CreateProposalModalProps) => {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState('hourly');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        worker_id: workerId,
        employer_id: user.id,
        title,
        description,
        rate: rate ? Number(rate) : null,
        rate_type: rateType,
        start_date: startDate || null,
        duration: duration || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: null,
      };

      const { error } = await supabase.from('active_proposals').insert(payload).select().single();
      if (error) throw error;

      // notify worker
      try {
        await sendNotification(workerId, {
          type: 'proposal',
          title: 'New Proposal',
          message: `${user?.name || 'An employer'} sent you a proposal: ${title}`,
          sender_id: user.id,
          link: `/worker/${workerId}`,
        } as any);
      } catch (err) {
        console.error('Failed to send notification to worker:', err);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create proposal:', err);
      alert('Failed to send proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold mb-3">Send Proposal</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border px-3 py-2 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border px-3 py-2 rounded-md" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">Rate</label>
              <input value={rate} onChange={e => setRate(e.target.value)} className="w-full border px-3 py-2 rounded-md" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Rate Type</label>
              <select value={rateType} onChange={e => setRateType(e.target.value)} className="w-full border px-3 py-2 rounded-md">
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border px-3 py-2 rounded-md" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Duration</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} className="w-full border px-3 py-2 rounded-md" />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-500 text-white rounded-md">{isSubmitting ? 'Sending...' : 'Send'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateProposalModal;
