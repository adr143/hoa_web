import React from 'react';
import { AuthProvider } from '@/provider/AuthProvider';
import { NotificationProvider } from '@/provider/NotificationProvider';
import { EmployerProvider } from '@/provider/EmployerProvider';
import { JobApplicationProvider } from '@/provider/JobApplicationProvider';
import { JobProvider } from '@/provider/JobProvider';
import { WorkerProvider } from '@/provider/WorkerProvider';
import { MessagingProvider } from '@/provider/MessagingProvider';
import LayoutContentClient from '@/components/LayoutContentClient';
import '@/app/styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14b8a6" />
        <title>House of Angels</title>
      </head>
      <body className="flex flex-col min-h-screen w-full bg-white">
        <AuthProvider>
          <NotificationProvider>
            <EmployerProvider>
              <WorkerProvider>
                <MessagingProvider>
                  <JobApplicationProvider>
                    <JobProvider>
                      <LayoutContentClient>{children}</LayoutContentClient>
                    </JobProvider>
                  </JobApplicationProvider>
                </MessagingProvider>
              </WorkerProvider>
            </EmployerProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
