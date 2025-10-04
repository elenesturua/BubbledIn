import React from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <div className="px-4 py-6 pb-20">
        {/* Header with Back Button */}
        <header className="flex items-center mb-8">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="rounded-full hover:bg-blue-50"
          aria-label="Go back to home"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Button>
          <h1 className="ml-3 text-2xl font-bold">About BubbledIn</h1>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12 px-2">
          <div className="mx-auto mb-6">
            <Logo 
              className="w-32 h-32"
              width={128}
              height={128}
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Clear Communication in Noisy Environments
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Create private audio bubbles where your team can hear each other clearly,
            even in loud hackathons, demo days, and crowded classrooms.
          </p>
        </div>

        {/* Simple Features */}
        <section className="space-y-6" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Key Features</h2>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">🔊 Crystal Clear Audio</h3>
            <p className="text-sm text-gray-600">
              WebRTC-powered audio with noise reduction ensures perfect sound quality
              for everyone in your bubble.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">⚡ Instant Setup</h3>
            <p className="text-sm text-gray-600">
              No accounts, no downloads. Just scan a QR code or enter a room code
              to get connected in seconds.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">📱 Live Captions</h3>
            <p className="text-sm text-gray-600">
              Real-time transcription helps everyone follow the conversation,
              making it accessible for all participants.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">🔒 Privacy First</h3>
            <p className="text-sm text-gray-600">
              Your bubbles are temporary and private. No data stored,
              no tracking - communicate and disconnect.
            </p>
          </div>
        </section>

        {/* Perfect For */}
        <section className="mt-12" aria-labelledby="use-cases-heading">
          <h2 id="use-cases-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Perfect For
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <ul className="space-y-2" role="list">
              <li className="flex items-center text-gray-700">
                <span className="text-blue-600 mr-3">✓</span>
                Hackathons & tech competitions
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-blue-600 mr-3">✓</span>
                Demo days & startup expos
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-blue-600 mr-3">✓</span>
                Crowded classrooms & study groups
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-blue-600 mr-3">✓</span>
                Conference networking & meetups
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-blue-600 mr-3">✓</span>
                Team collaboration in noisy spaces
              </li>
            </ul>
          </div>
        </section>

        {/* How It Works - Simplified */}
        <section className="mt-12 pb-8" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="text-lg font-semibold text-gray-900 mb-4">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-semibold text-sm">
                1
              </div>
              <span className="text-gray-700">Create or scan QR code to join</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-semibold text-sm">
                2
              </div>
              <span className="text-gray-700">Connect instantly via WebRTC</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-semibold text-sm">
                3
              </div>
              <span className="text-gray-700">Talk clearly with live captions</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}