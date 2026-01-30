import React from 'react';
import { StarIcon } from 'lucide-react';
export function Testimonials() {
  const testimonials = [{
    id: 1,
    name: 'Maria Garcia',
    role: 'Homeowner',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    content: "Finding reliable gardeners was always a challenge until I discovered House of Angels. The platform is intuitive, and the verification process gave me confidence in who I was hiring. Carlos has been maintaining our garden for 6 months now, and we couldn't be happier!",
    rating: 5
  }, {
    id: 2,
    name: 'James Rodriguez',
    role: 'Business Owner',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    content: "As a small business owner, I needed skilled workers for our office renovation. House of Angels helped me find qualified carpenters and electricians quickly. The quality of work was excellent, and the entire process was seamless. I'll definitely use the platform again for future projects.",
    rating: 5
  }, {
    id: 3,
    name: 'Elena Reyes',
    role: 'Professional Caregiver',
    image: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    content: 'House of Angels has transformed my career as a caregiver. The platform connects me with families who value my experience and skills. I now have a steady stream of work and earn more than I did working for an agency. The verification process also makes clients feel secure.',
    rating: 5
  }];
  return <section className="py-12 sm:py-16 bg-gradient-to-r from-teal-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
            What People Are Saying
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Hear from employers and workers who have found success on our
            platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map(testimonial => <div key={testimonial.id} className="bg-white rounded-lg p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => <StarIcon key={i} size={16} className={`sm:w-[18px] sm:h-[18px] ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'} fill-current`} />)}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                  <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base text-gray-800">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
}