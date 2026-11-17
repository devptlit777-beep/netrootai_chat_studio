import React from 'react';
import LandingHero from '../components/landing/LandingHero';
import LandingFloatingVideosShowcase from '../components/landing/LandingFloatingVideosShowcase';
import LandingProvidersMarquee from '../components/landing/LandingProvidersMarquee';
import LandingCuratedModels from '../components/landing/LandingCuratedModels';
import LandingStudiosShowcase from '../components/landing/LandingStudiosShowcase';
import LandingDeveloperGateway from '../components/landing/LandingDeveloperGateway';
import LandingPricingWallet from '../components/landing/LandingPricingWallet';
import LandingFaq from '../components/landing/LandingFaq';

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingFloatingVideosShowcase />
      <LandingProvidersMarquee />
      <LandingCuratedModels />
      <LandingStudiosShowcase />
      <LandingDeveloperGateway />
      <LandingPricingWallet />
      <LandingFaq />
    </>
  );
}
