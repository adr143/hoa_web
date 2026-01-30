import React from 'react';
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon } from 'lucide-react';
export default function Contact() {
  return <div className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Send Us a Message
            </h2>
            <form className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Your Name
                </label>
                <input type="text" id="name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Enter your name" />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Enter your email" />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="subject">
                  Subject
                </label>
                <input type="text" id="subject" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Enter subject" />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="message">
                  Message
                </label>
                <textarea id="message" rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Enter your message"></textarea>
              </div>
              <button type="submit" className="bg-teal-500 text-white px-6 py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm">
                Send Message
              </button>
            </form>
          </div>
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Contact Information
            </h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-teal-100 p-3 rounded-full mr-4">
                    <MapPinIcon size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      Our Office
                    </h3>
                    <p className="text-gray-600">
                      123 House of Angels Building, Bonifacio Global City, Taguig,
                      Metro Manila
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-teal-100 p-3 rounded-full mr-4">
                    <PhoneIcon size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      Phone
                    </h3>
                    <p className="text-gray-600">+63 (2) 8123 4567</p>
                    <p className="text-gray-600">+63 917 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-teal-100 p-3 rounded-full mr-4">
                    <MailIcon size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      Email
                    </h3>
                    <p className="text-gray-600">support@houseofangels.com</p>
                    <p className="text-gray-600">info@houseofangels.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-teal-100 p-3 rounded-full mr-4">
                    <ClockIcon size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      Business Hours
                    </h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM
                    </p>
                    <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                    <p className="text-gray-600">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-teal-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Need urgent help?
              </h3>
              <p className="text-gray-600 mb-4">
                Our customer support team is available to assist you with any
                questions or concerns.
              </p>
              <button className="bg-teal-500 text-white px-6 py-2 rounded-full font-medium hover:bg-teal-600 transition-colors">
                Live Chat Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;
}