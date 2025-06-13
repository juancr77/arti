import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar/Navbar';

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '2rem' }}> 
        <Outlet />
      </main>
    </>
  );
}