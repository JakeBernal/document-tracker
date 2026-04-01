import React from 'react';
import Hero from '../components/hero';
import Navbar from '../components/navbar';
import Services from '../components/services';
import Howitworks from '../components/howitworks';
import Signup from '../components/register';


export default function home() {
  return (
     <> 
      <Navbar />
      <Hero />
      <Services />
      <Howitworks />
   
    </>
  )
}
