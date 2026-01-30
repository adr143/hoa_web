import React from 'react';
import { HeartIcon, ShieldCheckIcon, ClockIcon } from 'lucide-react';
export function Features() {
  return <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Qualified babysitters nearby
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We carefully screen all caregivers to ensure your family receives
            the highest quality of care.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={<HeartIcon size={32} className="text-teal-500" />} title="Compassionate Care" description="Our caregivers are selected for their empathy and dedication to providing exceptional care." />
          <FeatureCard icon={<ShieldCheckIcon size={32} className="text-teal-500" />} title="Thoroughly Vetted" description="Every caregiver undergoes extensive background checks and reference verification." />
          <FeatureCard icon={<ClockIcon size={32} className="text-teal-500" />} title="Flexible Scheduling" description="Find care that fits your schedule, whether it's regular assistance or occasional help." />
        </div>
        <div className="mt-12 text-center">
          <button className="bg-teal-500 text-white px-8 py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm">
            Find Caregivers
          </button>
        </div>
      </div>
    </section>;
}

interface FeatureCardProps {
  icon: React.ReactNode; // Can be an icon component or JSX
  title: string;
  description: string;
}


function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default FeatureCard;
