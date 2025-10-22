import React from "react";
import { PenTool, Navigation, Layout, Rocket, Code } from "lucide-react";

const InnovationCore = () => {
  const features = [
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Write naturally",
      description: "Type, format, link—exactly like a word editor.",
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      title: "Jump anywhere",
      description:
        "Sidebar navigation glides you through pages and their sections.",
    },
    {
      icon: <Layout className="w-6 h-6" />,
      title: "Choose, don't tinker",
      description: "Pick a component & style preset; see it update instantly.",
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Preview, publish, done",
      description:
        'Real‑time rendering shows the final look before you hit "Publish."',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100"></div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply opacity-70 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-50 rounded-full mix-blend-multiply opacity-70 animate-pulse"
        style={{ animationDelay: "1s", animationDuration: "5s" }}
      ></div>
      <div
        className="absolute -top-10 right-1/4 w-40 h-40 bg-indigo-50 rounded-full mix-blend-multiply opacity-50 animate-pulse"
        style={{ animationDelay: "2s", animationDuration: "7s" }}
      ></div>

      {/* Code-like decorative element */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-5">
        <div className="text-8xl font-mono font-bold text-slate-900">{"{"}</div>
      </div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-5">
        <div className="text-8xl font-mono font-bold text-slate-900">{"}"}</div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16 relative">
          <div className="inline-block mb-6 p-2 bg-white rounded-full shadow-sm">
            <Code className="w-8 h-8 text-slate-800" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-light mb-6 text-slate-900">
            Innovation at the Core. <br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Effortless on the Surface.
            </span>
          </h2>

          <p className="text-xl text-slate-700 leading-relaxed relative">
            Behind Uniweb CMS is the open‑source{" "}
            <strong className="text-slate-900">Uniweb Framework</strong>—create
            content naturally, select powerful components, see changes in real
            time.
          </p>
        </div>

        {/* Feature Grid - with enhanced styling */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group"
            >
              {/* Feature number */}
              <div className="absolute -right-4 -top-4 text-8xl font-bold text-slate-50 select-none group-hover:text-slate-100 transition-colors">
                {index + 1}
              </div>

              <div className="relative z-10">
                <div className="p-3 bg-slate-50 rounded-lg inline-block mb-4 text-slate-800 group-hover:bg-slate-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-3 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Developer Note */}
        <div className="bg-white rounded-lg p-6 shadow-sm max-w-3xl mx-auto">
          <p className="text-center text-slate-600 italic">
            Component developers can access the{" "}
            <strong>Uniweb Framework</strong> at{" "}
            <strong className="text-blue-600 hover:text-blue-700 transition-colors">
              uniweb.io
            </strong>{" "}
            while content teams benefit from the full-featured CMS experience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InnovationCore;
