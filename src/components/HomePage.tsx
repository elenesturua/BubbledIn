import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Waves, Info, QrCode, Users, Shield, Zap, Headphones, Mic, ArrowRight } from "lucide-react";
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
                BubbledIn
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
            className="w-full max-w-md space-y-4 mb-8"
            aria-labelledby="actions-heading"
          >
            <h2 id="actions-heading" className="sr-only">
              Get Started
            </h2>

            {/* Join Room Button - Primary */}
            <div className="w-full">
              <button
                onClick={onJoinRoom}
                className="w-full h-20 text-xl font-bold rounded-2xl 
                          bg-blue-600 hover:bg-blue-700 
                          text-white shadow-xl hover:shadow-2xl 
                          transform hover:scale-105 hover:-translate-y-1
                          transition-all duration-300 ease-out
                          group relative
                          active:scale-95
                          border-0
                          flex items-center justify-center space-x-4
                          cursor-pointer
                          z-10
                          block"
                aria-label="Join an existing audio bubble with QR code"
              >
                <QrCode className="h-6 w-6" />
                <span>Join a Bubble</span>
                <ArrowRight className="h-6 w-6" />
              </button>
            </div>

            {/* Create Room Button - Secondary */}
            <button
              onClick={onCreateRoom}
              className="w-full h-16 text-lg font-semibold rounded-2xl 
                        bg-white hover:bg-blue-50
                        text-gray-700 hover:text-blue-700
                        border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg
                        transform hover:scale-105 hover:-translate-y-1
                        transition-all duration-300 ease-out
                        group relative overflow-hidden
                        active:scale-95
                        flex items-center justify-center space-x-4
                        cursor-pointer"
              aria-label="Create a new audio bubble"
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-blue-100/50 rounded-2xl scale-0 group-hover:scale-100 transition-all duration-300" />
              
              <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 group-hover:rotate-12 transition-all duration-300">
                <Users className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="group-hover:tracking-wider transition-all duration-300">Create a Bubble</span>
              <div className="group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
              </div>
            </button>
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
                aria-label="Learn more"
              >
                <Info className="h-4 w-4 mr-2 group-hover:text-white" aria-hidden="true" />
                <span className="group-hover:text-white">Learn More</span>
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
