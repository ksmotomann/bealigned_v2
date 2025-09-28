import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/CustomAuthContext';
import { 
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                <span className="text-[#5BA4CF]">Be</span>
                <span className="text-gray-800">Aligned</span>
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#feedback" className="text-gray-600 hover:text-gray-900">Feedback</a>
              {user ? (
                <button
                  onClick={() => navigate('/home')}
                  className="bg-[#5BA4CF] text-white px-4 py-2 rounded-lg hover:bg-[#4A93BE] transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-[#5BA4CF] text-white px-4 py-2 rounded-lg hover:bg-[#4A93BE] transition-colors"
                >
                  Login
                </button>
              )}
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-800 text-white px-6 py-2 rounded-full inline-block mb-6">
            Transform Your Co-Parenting Journey
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Co-Parenting shouldn't be this hard.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            BeAligned™ helps you cut through the conflict so you can focus on what matters most — your kids.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-[#5BA4CF] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#4A93BE] transition-colors flex items-center justify-center"
            >
              Find Your Alignment <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-24">
          
          {/* Your Co-Parenting Toolkit */}
          <div className="text-center">
            <div className="w-24 h-24 bg-[#E8F4F8] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BriefcaseIcon className="h-12 w-12 text-[#5BA4CF]" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Co-Parenting Toolkit</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Clear tools and real support to turn hard conversations into clear next steps.
            </p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left max-w-xl mx-auto">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Step-by-step guidance to help you find the right words when it matters most</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Track your progress and see how conversations shift over time</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Personalized support that adapts to your values and your family's needs</span>
              </li>
            </ul>
            <button
              onClick={handleGetStarted}
              className="bg-[#5BA4CF] text-white px-8 py-3 rounded-lg hover:bg-[#4A93BE] transition-colors inline-flex items-center"
            >
              See How It Works <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* BeH2O Chat Assistant */}
          <div className="text-center">
            <div className="w-24 h-24 bg-[#E8F4F8] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-[#5BA4CF]" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">BeH2O® Chat Assistant</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Your on-demand guide to handle co-parenting conversations with clarity.
            </p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left max-w-xl mx-auto">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Reflect on challenging situations and uncover what's at the show</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Watch your growth with simple, built-in check-ins</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Get tailored prompts that keep your words aligned with your values</span>
              </li>
            </ul>
            <button
              onClick={handleGetStarted}
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors inline-flex items-center"
            >
              Try It Now <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Scaffolding, Not a Crutch */}
          <div className="text-center">
            <div className="w-24 h-24 bg-[#FFF4E6] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ClipboardDocumentCheckIcon className="h-12 w-12 text-[#FDB863]" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Scaffolding, Not a Crutch</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Stay grounded in your values and connected to your why.
            </p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left max-w-xl mx-auto">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Responses that adjust as your situation changes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Suggestions tailored to your conversations, not canned advice</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Guidance that gets sharper the more you use it</span>
              </li>
            </ul>
            <button
              onClick={handleGetStarted}
              className="bg-[#5BA4CF] text-white px-8 py-3 rounded-lg hover:bg-[#4A93BE] transition-colors inline-flex items-center"
            >
              Transform the Conversation <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>

        </div>
      </section>

      {/* Safe Space Notice */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            • A safe space designed to support, never criticize
          </p>
        </div>
      </section>

      {/* Take the First Step */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <button
            onClick={handleGetStarted}
            className="bg-[#2B5F8F] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#1A4E7E] transition-colors inline-flex items-center"
          >
            Take the First Step <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* How BeAligned Works */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How BeAligned™ Works
          </h2>
          <p className="text-center text-gray-600 mb-12">
            A step-by-step process that turns overwhelming conversations into doable next steps.
          </p>

          <div className="space-y-12 max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#5BA4CF] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pause</h3>
              <p className="text-gray-600">
                Tell us what's on your mind in a safe, confidential space.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#5BA4CF] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reflect with Guidance</h3>
              <p className="text-gray-600">
                Work through a 7-phase process with AI prompts that keep you focused and steady.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#5BA4CF] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gain Clarity</h3>
              <p className="text-gray-600">
                Discover insights and perspectives you may have missed.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#5BA4CF] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Take Action</h3>
              <p className="text-gray-600">
                Leave with clear next steps and renewed confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-[#5BA4CF] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Clarity?</h2>
          <p className="text-xl mb-8 opacity-90">
            Every parent deserves support that's private, judgment-free, and designed to help you grow. 
            BeAligned™ is here to guide you forward — one conversation at a time.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-[#5BA4CF] px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Start Your Journey <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2024 BeAligned. All rights reserved.</p>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">BeAligned Demo</h3>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              <PlayIcon className="h-20 w-20 text-gray-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;