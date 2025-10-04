import React from "react";
import { Button } from "./ui/button";
import { Waves, QrCode, Info } from "lucide-react";
import { Logo } from "./Logo";

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onAbout: () => void;
}

export function HomePage({
  onCreateRoom,
  onJoinRoom,
  onAbout,
}: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-8 md:py-16">
        <div className="w-full max-w-md space-y-10 md:space-y-12">
          {/* Header */}
          <header className="text-center space-y-6 md:space-y-8" role="banner">
            <div className="relative inline-block">
              <Logo 
                className="w-24 h-24 md:w-40 md:h-40"
                width={160}
                height={160}
              />
              <div
                className="absolute -top-1 -right-1 w-5 h-5 md:w-8 md:h-8 bg-green-500 rounded-full border-2 md:border-4 border-white shadow-lg"
                role="status"
                aria-label="App is online and ready"
              >
                <span className="sr-only">System is online</span>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
                BubbledIn
              </h1>
              <p className="text-base md:text-xl text-gray-600">
                Clear communication in noisy environments
              </p>
            </div>
          </header>

          {/* Action Buttons */}
          <section className="space-y-4 md:space-y-6" aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="sr-only">
              Get Started
            </h2>

            <Button
              onClick={onCreateRoom}
              size="lg"
              className="w-full h-14 md:h-16 text-base md:text-lg rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Create a new audio bubble room"
            >
              <Waves className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" aria-hidden="true" />
              Create Audio Bubble
            </Button>

            <Button
              onClick={onJoinRoom}
              variant="outline"
              size="lg"
              className="w-full h-14 md:h-16 text-base md:text-lg rounded-2xl border-2 hover:bg-gray-50 transition-colors"
              aria-label="Join an existing audio bubble with QR code"
            >
              <QrCode className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" aria-hidden="true" />
              Join QR Code
            </Button>

            <Button
              onClick={onAbout}
              variant="ghost"
              size="lg"
              className="w-full h-12 md:h-14 text-sm md:text-base rounded-2xl text-blue-600 hover:bg-blue-50 transition-colors mt-4 md:mt-6"
              aria-label="Learn more about BubbledIn"
            >
              <Info className="h-4 w-4 md:h-5 md:w-5 mr-2" aria-hidden="true" />
              Learn More
            </Button>
          </section>
        </div>
      </div>

      {/* Footer Info */}
      <footer
        className="text-center text-gray-500 pb-8 px-6"
        role="contentinfo"
      >
        <p className="text-sm mb-3">
          Perfect for hackathons & demo days
        </p>
        <div className="flex items-center justify-center space-x-3 text-xs">
          <span>No accounts</span>
          <span className="text-gray-400">•</span>
          <span>Instant setup</span>
          <span className="text-gray-400">•</span>
          <span>Private</span>
        </div>
      </footer>
    </div>
  );
}