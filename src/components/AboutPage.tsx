import { Button } from "./ui/button";
import {
  ArrowLeft,
  Mic,
  Users,
  Accessibility,
  Volume2,
  Shield,
  Zap,
} from "lucide-react";
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
            className="rounded-full"
            aria-label="Go back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-3 text-2xl font-bold">
            About Bubbledin
          </h1>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12 px-2">
          <div className="mx-auto mb-4">
            <Logo className="w-20 h-20 mx-auto drop-shadow-lg" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Clear Communication in Noisy Environments
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Audio Bubbles creates private audio spaces where
            your team can hear each other perfectly, even in
            loud hackathons, demo expos, and crowded classrooms.
          </p>
        </div>

        {/* Features Section */}
        <section
          aria-labelledby="features-heading"
          className="space-y-4"
        >
          <h2
            id="features-heading"
            className="text-lg font-semibold text-gray-900 mb-4 px-2"
          >
            Key Features
          </h2>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div
                className="bg-blue-100 rounded-2xl p-3 shrink-0"
                role="img"
                aria-label="Audio feature icon"
              >
                <Mic
                  className="h-6 w-6 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Crystal Clear Audio
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  WebRTC-powered audio with advanced noise
                  reduction technology filters out background
                  noise, ensuring everyone in your bubble hears
                  you perfectly.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div
                className="bg-green-100 rounded-2xl p-3 shrink-0"
                role="img"
                aria-label="Quick join feature icon"
              >
                <Users
                  className="h-6 w-6 text-green-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Instant Joining
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Simply scan a QR code or enter a room code. No
                  accounts, no setup, no friction. Get your team
                  connected in seconds.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div
                className="bg-purple-100 rounded-2xl p-3 shrink-0"
                role="img"
                aria-label="Accessibility feature icon"
              >
                <Accessibility
                  className="h-6 w-6 text-purple-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Accessibility First
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Real-time transcription provides live captions
                  for everyone. Full screen reader support and
                  keyboard navigation ensure everyone can
                  participate.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div
                className="bg-orange-100 rounded-2xl p-3 shrink-0"
                role="img"
                aria-label="Presenter feature icon"
              >
                <Volume2
                  className="h-6 w-6 text-orange-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Presenter Mode
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Boost a speaker's volume for presentations and
                  demos. Perfect for team pitches where one
                  person needs to be heard above the rest.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div
                className="bg-pink-100 rounded-2xl p-3 shrink-0"
                role="img"
                aria-label="Privacy feature icon"
              >
                <Shield
                  className="h-6 w-6 text-pink-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Privacy Focused
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your audio bubbles are private and temporary.
                  No data stored, no tracking, no accounts
                  required. Join, communicate, and disconnect.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div
                className="bg-teal-100 rounded-2xl p-3 shrink-0"
                role="img"
                aria-label="Control feature icon"
              >
                <Zap
                  className="h-6 w-6 text-teal-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Push-to-Talk Option
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Control when you're heard with optional
                  push-to-talk mode. Great for minimizing
                  background noise when you're not actively
                  speaking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section
          aria-labelledby="use-cases-heading"
          className="mt-12"
        >
          <h2
            id="use-cases-heading"
            className="text-lg font-semibold text-gray-900 mb-4 px-2"
          >
            Perfect For
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <ul className="space-y-3" role="list">
              <li className="flex items-start">
                <span
                  className="text-blue-600 mr-3 mt-0.5"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-gray-700">
                  Hackathons and tech competitions
                </span>
              </li>
              <li className="flex items-start">
                <span
                  className="text-blue-600 mr-3 mt-0.5"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-gray-700">
                  Demo days and startup expos
                </span>
              </li>
              <li className="flex items-start">
                <span
                  className="text-blue-600 mr-3 mt-0.5"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-gray-700">
                  Crowded classrooms and study groups
                </span>
              </li>
              <li className="flex items-start">
                <span
                  className="text-blue-600 mr-3 mt-0.5"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-gray-700">
                  Conference networking and meetups
                </span>
              </li>
              <li className="flex items-start">
                <span
                  className="text-blue-600 mr-3 mt-0.5"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-gray-700">
                  Team collaboration in noisy spaces
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* How It Works */}
        <section
          aria-labelledby="how-it-works-heading"
          className="mt-12"
        >
          <h2
            id="how-it-works-heading"
            className="text-lg font-semibold text-gray-900 mb-4 px-2"
          >
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Create or Join
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Start a new audio bubble or scan a QR code to
                  join an existing one
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Connect Instantly
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your browser connects directly to other
                  participants via WebRTC
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Communicate Clearly
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Talk freely with your team while the world
                  around you stays muted
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section
          aria-labelledby="tech-heading"
          className="mt-12 pb-8"
        >
          <h2
            id="tech-heading"
            className="text-lg font-semibold text-gray-900 mb-4 px-2"
          >
            Technology
          </h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Built with modern web technologies for maximum
              compatibility and performance:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                WebRTC
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                React
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                Browser Audio API
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                Real-time Transcription
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}