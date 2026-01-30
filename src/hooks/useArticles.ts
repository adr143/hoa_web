'use client';

import { useContext } from 'react';
import { ArticleContext } from '@/context/ArticleContext';

export const useArticles = () => {
  const context = useContext(ArticleContext);
  
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  
  return context;
};

