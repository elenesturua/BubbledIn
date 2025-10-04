import { Button } from "./ui/button";
import { Volume2, Waves, Info } from "lucide-react";
import React from "react";

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Header */}
        <header
          className="text-center space-y-6 mb-12"
          role="banner"
        >
          <div className="relative inline-block">
            <div
              className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 w-28 h-28 shadow-xl"
              role="img"
              aria-label="Audio Bubbles app icon"
            >
              <Volume2
                className="h-12 w-12 text-white mx-auto"
                aria-hidden="true"
              />
            </div>
            <div
              className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-white shadow-lg"
              role="status"
              aria-label="App is online and ready"
            >
              <span className="sr-only">System is online</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Bubbledin
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Clear communication in noisy environments
            </p>
          </div>
        </header>

        {/* Action Buttons */}
        <section
          className="w-full max-w-sm space-y-4"
          aria-labelledby="actions-heading"
        >
          <h2 id="actions-heading" className="sr-only">
            Get Started
          </h2>

          <Button
            onClick={onCreateRoom}
            size="lg"
            className="w-full h-16 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Create a new audio bubble room"
          >
            <Waves
              className="h-6 w-6 mr-3"
              aria-hidden="true"
            />
            Create Audio Bubble
          </Button>

          <Button
            onClick={onJoinRoom}
            variant="outline"
            size="lg"
            className="w-full h-16 text-lg rounded-2xl border-2 hover:bg-gray-50 transition-colors"
            aria-label="Join an existing audio bubble with QR code"
          >
            Join with QR Code
          </Button>

          <Button
            onClick={onAbout}
            variant="ghost"
            size="lg"
            className="w-full h-12 text-base rounded-2xl text-blue-600 hover:bg-blue-50 transition-colors mt-4"
            aria-label="Learn more about Audio Bubbles"
          >
            <Info className="h-5 w-5 mr-2" aria-hidden="true" />
            Learn More
          </Button>
        </section>
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