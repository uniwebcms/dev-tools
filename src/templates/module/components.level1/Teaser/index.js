import React from "react";

const UniwebTeaser = (props) => {
  console.log({ props });

  let {
    variant = "compact", // 'compact', 'normal', 'spacious'
    showLightEffects = false,
    className = "",
  } = props || {};
  // Layout variants with Tailwind classes
  const variants = {
    compact: {
      container:
        "px-4 py-10 sm:px-6 sm:py-12 lg:px-12 lg:py-16 xl:px-16 xl:py-20",
      gap: "gap-8 lg:gap-12 xl:gap-16",
      showcaseHeight: "h-52 sm:h-60 md:h-64 lg:h-80 xl:h-96",
    },
    normal: {
      container:
        "px-6 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20 xl:px-24 xl:py-28 2xl:px-32 2xl:py-32",
      gap: "gap-12 lg:gap-16 xl:gap-20 2xl:gap-32",
      showcaseHeight: "h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[420px]",
    },
    spacious: {
      container:
        "px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-28 xl:px-32 xl:py-36 2xl:px-40 2xl:py-40",
      gap: "gap-16 lg:gap-24 xl:gap-32 2xl:gap-40",
      showcaseHeight: "h-72 sm:h-80 md:h-96 lg:h-[420px] xl:h-[480px]",
    },
  };

  const currentVariant = variants[variant] || variants.normal;

  return (
    <section
      className={`relative max-w-[1800px] mx-auto my-16 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 ${currentVariant.container}`}
      >
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 h-80 w-80 rounded-full bg-cyan-400 opacity-20 blur-3xl" />

          {/* Optional light beams */}
          {showLightEffects && (
            <>
              <div className="hidden sm:block absolute left-1/3 h-full w-px bg-gradient-to-b from-transparent via-blue-400/40 to-transparent animate-pulse" />
              <div className="hidden sm:block absolute right-1/3 h-full w-px bg-gradient-to-b from-transparent via-blue-400/40 to-transparent animate-pulse animation-delay-2000" />
            </>
          )}
        </div>

        <div
          className={`relative flex flex-col lg:flex-row items-center ${currentVariant.gap}`}
        >
          {/* Left side - Screens showcase */}
          <div
            className={
              `hidden sm:flex flex-1 lg:flex-[1.1] relative ${currentVariant.showcaseHeight} w-full` /*perspective-1000*/
            }
          >
            {/* Screen 1 - Back left */}
            <div
              className={`absolute screen-1 transform -rotate-y-20 rotate-x-5 -translate-z-60 animate-float-slow
              ${
                variant === "compact"
                  ? "w-40 h-28 sm:w-44 sm:h-32 md:w-48 md:h-36 lg:w-56 lg:h-40 xl:w-64 xl:h-48"
                  : variant === "spacious"
                  ? "w-52 h-36 sm:w-56 sm:h-40 md:w-64 md:h-48 lg:w-72 lg:h-52 xl:w-80 xl:h-60"
                  : "w-44 h-32 sm:w-48 sm:h-36 md:w-52 md:h-40 lg:w-64 lg:h-48 xl:w-72 xl:h-52"
              }
              ${
                variant === "compact"
                  ? "top-2 sm:top-4 left-0"
                  : variant === "spacious"
                  ? "top-8 sm:top-12 left-0"
                  : "top-4 sm:top-8 left-0"
              }`}
            >
              <div className="h-full bg-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-60" />
                <div className="p-3 sm:p-4 lg:p-5 xl:p-6 h-full">
                  {/* E-commerce Layout */}
                  <div className="flex gap-3 h-full">
                    {/* Sidebar */}
                    <div className="w-16 lg:w-20 space-y-2">
                      <div className="h-6 bg-blue-400/10 rounded border border-blue-400/20" />
                      <div className="h-4 bg-white/10 rounded" />
                      <div className="h-4 bg-white/10 rounded" />
                      <div className="h-4 bg-cyan-400/10 rounded border border-cyan-400/20" />
                      <div className="h-4 bg-white/10 rounded" />
                    </div>
                    {/* Main content */}
                    <div className="flex-1 space-y-3">
                      {/* Search bar */}
                      <div className="h-6 bg-white/5 rounded-full border border-white/10" />
                      {/* Product grid */}
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded aspect-square" />
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-400/10 rounded aspect-square" />
                        <div className="bg-gradient-to-br from-green-500/10 to-teal-400/10 rounded aspect-square" />
                        <div className="bg-gradient-to-br from-orange-500/10 to-red-400/10 rounded aspect-square" />
                        <div className="bg-gradient-to-br from-indigo-500/10 to-blue-400/10 rounded aspect-square" />
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-400/10 rounded aspect-square" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Screen 2 - Center */}
            <div
              className={`absolute screen-2 left-1/2 -translate-x-1/2 transform rotate-x-3 translate-z-20 z-30 animate-float-medium
              ${
                variant === "compact"
                  ? "w-48 h-36 sm:w-52 sm:h-40 md:w-56 md:h-44 lg:w-64 lg:h-48 xl:w-72 xl:h-56"
                  : variant === "spacious"
                  ? "w-60 h-44 sm:w-64 sm:h-48 md:w-72 md:h-52 lg:w-80 lg:h-60 xl:w-96 xl:h-72"
                  : "w-52 h-36 sm:w-56 sm:h-40 md:w-60 md:h-44 lg:w-72 lg:h-56 xl:w-80 xl:h-64"
              }
              ${
                variant === "compact"
                  ? "top-6 sm:top-8 md:top-10"
                  : variant === "spacious"
                  ? "top-12 sm:top-20 md:top-24"
                  : "top-8 sm:top-12 md:top-16"
              }`}
            >
              <div className="h-full bg-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Minimal browser bar */}
                <div className="h-8 lg:h-10 bg-white/3 border-b border-white/10 flex items-center px-3 lg:px-4">
                  <div className="flex-1 h-5 lg:h-6 bg-white/5 rounded-full pt-1 px-2">
                    <pre className="text-xs text-white/15">
                      https://example.com
                    </pre>
                  </div>
                </div>
                <div className="p-3 sm:p-4 lg:p-5 xl:p-6 space-y-2 sm:space-y-3 lg:space-y-4 h-full flex flex-col">
                  {/* Hero/Feature Section */}
                  <div className="h-14 sm:h-16 lg:h-20 xl:h-24 bg-gradient-to-r from-blue-500/50 to-cyan-400/50 rounded-md lg:rounded-lg relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    {/* <div className="relative z-10 flex items-center gap-2">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-full" />
                      <div className="hidden sm:block">
                        <div className="h-3 w-20 bg-white/30 rounded mb-1" />
                        <div className="h-2 w-16 bg-white/20 rounded" />
                      </div>
                    </div> */}
                  </div>

                  {/* Navigation tabs */}
                  <div className="flex gap-2">
                    <div className="h-6 px-3 bg-cyan-400/20 rounded border border-cyan-400/30 flex-shrink-0" />
                    <div className="h-6 px-3 bg-white/10 rounded flex-shrink-0" />
                    <div className="h-6 px-3 bg-white/10 rounded flex-shrink-0" />
                  </div>

                  {/* Content cards */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded p-2 space-y-1">
                      <div className="h-2 bg-white/20 rounded w-3/4" />
                      <div className="h-2 bg-white/10 rounded" />
                      <div className="h-4 bg-purple-400/20 rounded mt-2" />
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded p-2 space-y-1">
                      <div className="h-2 bg-white/20 rounded w-3/4" />
                      <div className="h-2 bg-white/10 rounded" />
                      <div className="h-4 bg-green-400/20 rounded mt-2" />
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-blue-400/10 rounded flex items-center justify-center">
                      <div className="text-xs text-blue-400 font-bold">•••</div>
                    </div>
                    <div className="h-8 bg-cyan-400/10 rounded flex items-center justify-center">
                      <div className="text-xs text-cyan-400 font-bold">•••</div>
                    </div>
                    <div className="h-8 bg-green-400/10 rounded flex items-center justify-center">
                      <div className="text-xs text-green-400 font-bold">
                        •••
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Screen 3 - Back right */}
            <div
              className={`absolute screen-3 transform rotate-y-20 rotate-x-5 -translate-z-40 z-20 animate-float-slow animation-delay-1000
              ${
                variant === "compact"
                  ? "w-40 h-28 sm:w-44 sm:h-32 md:w-48 md:h-36 lg:w-56 lg:h-40 xl:w-64 xl:h-48"
                  : variant === "spacious"
                  ? "w-52 h-36 sm:w-56 sm:h-40 md:w-64 md:h-48 lg:w-72 lg:h-52 xl:w-80 xl:h-60"
                  : "w-44 h-32 sm:w-48 sm:h-36 md:w-52 md:h-40 lg:w-64 lg:h-48 xl:w-72 xl:h-52"
              }
              ${
                variant === "compact"
                  ? "bottom-2 sm:bottom-4 right-0"
                  : variant === "spacious"
                  ? "bottom-8 sm:bottom-12 right-0"
                  : "bottom-4 sm:bottom-8 right-0"
              }`}
            >
              <div className="h-full bg-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-60" />
                <div className="p-3 sm:p-4 lg:p-5 xl:p-6 h-full flex flex-col">
                  {/* Dashboard/Analytics Layout */}
                  <div className="space-y-3 flex-1">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-400/10 rounded p-2">
                        <div className="h-1.5 w-8 bg-blue-400/30 rounded mb-1" />
                        <div className="h-3 bg-blue-400/20 rounded" />
                      </div>
                      <div className="bg-gradient-to-br from-green-500/10 to-green-400/10 rounded p-2">
                        <div className="h-1.5 w-8 bg-green-400/30 rounded mb-1" />
                        <div className="h-3 bg-green-400/20 rounded" />
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-400/10 rounded p-2">
                        <div className="h-1.5 w-8 bg-purple-400/30 rounded mb-1" />
                        <div className="h-3 bg-purple-400/20 rounded" />
                      </div>
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg border border-cyan-400/20 p-2">
                      <div className="h-full relative">
                        {/* Chart lines */}
                        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-full px-1">
                          <div className="w-4 h-3/4 bg-cyan-400/20 rounded-t" />
                          <div className="w-4 h-1/2 bg-cyan-400/20 rounded-t" />
                          <div className="w-4 h-5/6 bg-cyan-400/20 rounded-t" />
                          <div className="w-4 h-2/3 bg-cyan-400/20 rounded-t" />
                          <div className="w-4 h-4/5 bg-cyan-400/20 rounded-t" />
                          <div className="w-4 h-1/2 bg-cyan-400/20 rounded-t hidden sm:block" />
                          <div className="w-4 h-3/4 bg-cyan-400/20 rounded-t hidden lg:block" />
                        </div>
                      </div>
                    </div>

                    {/* Activity feed */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <div className="h-2 bg-white/10 rounded flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <div className="h-2 bg-white/10 rounded flex-1 w-4/5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                        <div className="h-2 bg-white/10 rounded flex-1 w-3/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="flex-1 w-full lg:max-w-2xl xl:max-w-3xl text-center sm:text-center lg:text-left">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.15em] text-cyan-400 uppercase mb-3 sm:mb-4">
              The Uniweb Framework
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-5xl 2xl:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6">
              Any Site. Any Design.
              <br />
              Now Possible
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
              Build component systems without limits. Create once, deploy
              anywhere, and maintain complete ownership of your code.
            </p>

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0">
              <li className="flex items-start gap-3 justify-center sm:justify-center lg:justify-start">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
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
                <span className="text-white/85 text-base sm:text-lg lg:text-lg xl:text-xl">
                  Unlimited component flexibility
                </span>
              </li>
              <li className="flex items-start gap-3 justify-center sm:justify-center lg:justify-start">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
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
                <span className="text-white/85 text-base sm:text-lg lg:text-lg xl:text-xl">
                  Deploy to multiple sites instantly
                </span>
              </li>
              <li className="flex items-start gap-3 justify-center sm:justify-center lg:justify-start">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
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
                <span className="text-white/85 text-base sm:text-lg lg:text-lg xl:text-xl">
                  Complete ownership of your IP
                </span>
              </li>
            </ul>

            <a
              href="#"
              className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/25 group"
            >
              Explore the Framework
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1"
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
            transform: translateY(0px) rotateY(var(--rotate-y, -20deg))
              rotateX(5deg) translateZ(var(--translate-z, -60px));
          }
          50% {
            transform: translateY(-15px) rotateY(var(--rotate-y, -20deg))
              rotateX(5deg) translateZ(var(--translate-z, -60px));
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
          --rotate-y: 20deg;
        }

        .-rotate-y-20 {
          --rotate-y: -20deg;
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
          --translate-z: -40px;
        }

        .-translate-z-60 {
          --translate-z: -60px;
        }
      `}</style>
    </section>
  );
};

export default UniwebTeaser;
