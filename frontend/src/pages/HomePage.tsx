import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { FloatingParticles, FloatingElements, Home } from '@/components';

const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      <FloatingElements />
      <FloatingParticles />
      <MainLayout>
       <Home/>
      </MainLayout>
    </div>
  );
};

export default HomePage;
