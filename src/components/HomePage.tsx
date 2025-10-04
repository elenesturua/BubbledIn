import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Waves, Info, QrCode, Users, Shield, Zap, Headphones, Mic } from "lucide-react";
import Logo from "./Logo";

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Hero Section */}
          <header className="text-center space-y-8 mb-12" role="banner">
            {/* Logo */}
            <div className="relative inline-block">
              <Logo width={128} height={128} className="mx-auto" />
            </div>

            {/* Title and Tagline */}
            <div className="space-y-4">
              <h1 className="text-xl md:text-8xl lg:text-9xl font-extrabold tracking-tight leading-tight text-blue-700" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                bubbledin
              </h1>
              <p className="text-xl text-gray-700 max-w-lg mx-auto leading-relaxed">
                Create private audio spaces in noisy environments.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
                <Shield className="h-3 w-3 mr-3" />
                Private
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 px-3 py-1">
                <Zap className="h-3 w-3 mr-3" />
                Instant
              </Badge>
            </div>
          </header>

          {/* Main Action Buttons */}
          <section
            className="w-full max-w-sm space-y-4 mb-8"
            aria-labelledby="actions-heading"
          >
            <h2 id="actions-heading" className="sr-only">
              Get Started
            </h2>

            {/* Create Room Button */}
            <Button
              onClick={onCreateRoom}
              variant="solid"
              size="lg"
              className="w-full h-16 text-lg rounded-2xl 
                        bg-blue-600 hover:bg-blue-700 
                        text-white shadow-lg hover:shadow-xl 
                        transform hover:scale-105 transition-all duration-200 cursor-pointer"
              aria-label="Join an existing audio bubble with QR code"
            >
              <div className="flex items-center justify-center space-x-3">
                <QrCode className="h-5 w-5" aria-hidden="true" />
                <span>Create Audio Bubble</span>
              </div>
            </Button>

            {/* Join Room Button */}
            <Button
              onClick={onJoinRoom}
              variant="solid"
              size="lg"
              className="w-full h-16 text-lg rounded-2xl 
                        bg-blue-600 hover:bg-blue-700 
                        text-white shadow-lg hover:shadow-xl 
                        transform hover:scale-105 transition-all duration-200 cursor-pointer"
              aria-label="Join an existing audio bubble with QR code"
            >
              <div className="flex items-center justify-center space-x-3">
                <QrCode className="h-5 w-5" aria-hidden="true" />
                <span>Join with QR Code</span>
              </div>
            </Button>
          </section>

          {/* Learn More Button */}
          <Card className="group relative overflow-hidden max-w-md mx-auto mt-6 bg-white/60 backdrop-blur-sm border border-blue-200/40 shadow-md hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 cursor-pointer">
            <CardContent className="p-4 flex items-center justify-center relative">
              {/* gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" aria-hidden="true" />
              <Button
                onClick={onAbout}
                variant="ghost"
                size="lg"
                className="relative z-10 text-blue-600 group-hover:text-white hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
                aria-label="Learn more about Audio Bubbles"
              >
                <Info className="h-4 w-4 mr-2 group-hover:text-white" aria-hidden="true" />
                <span className="group-hover:text-white">Learn More About Audio Bubbles</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Footer */}
        <footer className="text-center pb-8 px-6" role="contentinfo">
          <Card className="bg-white/40 backdrop-blur-sm border border-blue-200/30 shadow-lg max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-blue-700 font-medium mb-3">
                🎯 Built for Noisy Environments
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="mr-3">No Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" aria-hidden="true" />
                  <span className="mr-3">Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" aria-hidden="true" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </footer>
      </div>
    </div>
  );
}
