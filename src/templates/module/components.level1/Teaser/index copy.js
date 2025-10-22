import React from "react";

const UniwebTeaser = () => {
  return (
    <section className="relative max-w-7xl mx-auto my-16 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 xl:px-32 xl:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 h-80 w-80 rounded-full bg-cyan-400 opacity-20 blur-3xl" />

          {/* Light beams */}
          <div className="absolute left-1/3 h-full w-px bg-gradient-to-b from-transparent via-blue-400/40 to-transparent animate-pulse" />
          <div className="absolute right-1/3 h-full w-px bg-gradient-to-b from-transparent via-blue-400/40 to-transparent animate-pulse animation-delay-2000" />
        </div>

        <div className="relative flex flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-24">
          {/* Left side - Screens showcase */}
          <div className="flex-1 lg:flex-[1.2] relative h-72 sm:h-80 lg:h-96 w-full perspective-1000">
            {/* Screen 1 - Back left */}
            <div className="absolute top-8 left-0 lg:left-0 w-48 sm:w-56 lg:w-64 xl:w-72 h-36 sm:h-40 lg:h-48 xl:h-52 transform -rotate-y-20 rotate-x-5 -translate-z-60 animate-float-slow">
              <div className="h-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-60" />
                <div className="p-4 lg:p-6 space-y-2 lg:space-y-3">
                  <div className="h-3 bg-white/10 rounded-md" />
                  <div className="h-3 bg-white/10 rounded-md w-4/5" />
                  <div className="h-3 bg-white/10 rounded-md w-3/5" />
                  <div className="h-3 bg-white/10 rounded-md" />
                  <div className="h-3 bg-white/10 rounded-md w-4/5" />
                </div>
              </div>
            </div>

            {/* Screen 2 - Center */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-56 sm:w-64 lg:w-72 xl:w-80 h-40 sm:h-48 lg:h-56 xl:h-64 transform rotate-x-3 translate-z-20 z-30 animate-float-medium">
              <div className="h-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Minimal browser bar */}
                <div className="h-10 bg-white/3 border-b border-white/10 flex items-center px-4">
                  <div className="flex-1 h-6 bg-white/5 rounded-full" />
                </div>
                <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                  <div className="h-14 lg:h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                  <div className="h-3 bg-white/10 rounded-md" />
                  <div className="h-3 bg-white/10 rounded-md w-4/5" />
                  <div className="h-3 bg-white/10 rounded-md w-3/5" />
                </div>
              </div>
            </div>

            {/* Screen 3 - Back right */}
            <div className="absolute bottom-8 right-0 lg:right-0 w-48 sm:w-56 lg:w-64 xl:w-72 h-36 sm:h-40 lg:h-48 xl:h-52 transform rotate-y-20 rotate-x-5 -translate-z-40 z-20 animate-float-slow animation-delay-1000">
              <div className="h-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-60" />
                <div className="p-4 lg:p-6">
                  <div className="grid grid-cols-2 gap-2 lg:gap-3 h-full">
                    <div className="bg-cyan-400/10 rounded-lg border border-cyan-400/20" />
                    <div className="bg-cyan-400/10 rounded-lg border border-cyan-400/20" />
                    <div className="bg-cyan-400/10 rounded-lg border border-cyan-400/20" />
                    <div className="bg-cyan-400/10 rounded-lg border border-cyan-400/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="flex-1 max-w-xl text-center lg:text-left">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.15em] text-cyan-400 uppercase mb-4">
              The Uniweb Framework
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
              Any Site. Any Design.
              <br />
              Now Possible
            </h2>
            <p className="text-lg sm:text-xl text-white/70 mb-8">
              Build component systems without limits. Create once, deploy
              anywhere, and maintain complete ownership of your code.
            </p>

            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-3 justify-center lg:justify-start">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-white/85 text-lg">
                  Unlimited component flexibility
                </span>
              </li>
              <li className="flex items-start gap-3 justify-center lg:justify-start">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-white/85 text-lg">
                  Deploy to multiple sites instantly
                </span>
              </li>
              <li className="flex items-start gap-3 justify-center lg:justify-start">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-white/85 text-lg">
                  Complete ownership of your IP
                </span>
              </li>
            </ul>

            <a
              href="#"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/25 group"
            >
              Explore the Framework
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotateY(-20deg) rotateX(5deg)
              translateZ(-60px);
          }
          50% {
            transform: translateY(-15px) rotateY(-20deg) rotateX(5deg)
              translateZ(-60px);
          }
        }

        @keyframes float-medium {
          0%,
          100% {
            transform: translateX(-50%) translateY(0px) rotateX(3deg)
              translateZ(20px);
          }
          50% {
            transform: translateX(-50%) translateY(-20px) rotateX(3deg)
              translateZ(20px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 18s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .perspective-1000 {
          perspective: 1000px;
          transform-style: preserve-3d;
        }

        .rotate-y-20 {
          transform: rotateY(20deg);
        }

        .-rotate-y-20 {
          transform: rotateY(-20deg);
        }

        .rotate-x-5 {
          transform: rotateX(5deg);
        }

        .rotate-x-3 {
          transform: rotateX(3deg);
        }

        .translate-z-20 {
          transform: translateZ(20px);
        }

        .-translate-z-40 {
          transform: translateZ(-40px);
        }

        .-translate-z-60 {
          transform: translateZ(-60px);
        }
      `}</style>
    </section>
  );
};

export default UniwebTeaser;
