import React, { useState } from "react";
import {
  Megaphone,
  FileText,
  Database,
  GraduationCap,
  PenTool,
  Image,
  Code,
  ArrowRight,
  Globe,
} from "lucide-react";

const UseCasesSection = () => {
  const [activeTab, setActiveTab] = useState("marketing");

  const useCases = [
    {
      id: "marketing",
      icon: <Megaphone className="w-6 h-6" />,
      title: "Marketing Sites",
      problem: "Frustrated by inflexible template systems?",
      solution:
        "Premium design that evolves with your brand—no designers needed for updates.",
    },
    {
      id: "documentation",
      icon: <FileText className="w-6 h-6" />,
      title: "Documentation",
      problem: "Maintaining separate CMS and docs systems?",
      solution:
        "Beautiful documentation with code highlighting and intuitive navigation.",
    },
    {
      id: "dynamic",
      icon: <Database className="w-6 h-6" />,
      title: "Dynamic Data",
      problem: "Static CMS can't handle your real-time data?",
      solution:
        "Seamlessly integrate live data while maintaining elegant design.",
    },
    {
      id: "academic",
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Academic Sites",
      problem: "Faculty, research, and departments disconnected?",
      solution:
        "Create interconnected academic ecosystems with automatic updates.",
    },
    {
      id: "blogging",
      icon: <PenTool className="w-6 h-6" />,
      title: "Blogging",
      problem: "Blog looks like it's from 2010?",
      solution:
        "Modern layouts with perfect typography that update in real-time.",
    },
    {
      id: "media",
      icon: <Image className="w-6 h-6" />,
      title: "Media Galleries",
      problem: "Galleries that look good but load slowly?",
      solution:
        "Lightning-fast media showcases that adapt perfectly to all devices.",
    },
    {
      id: "multilingual",
      icon: <Globe className="w-6 h-6" />,
      title: "Multilingual Sites",
      problem: "Multiple language versions creating maintenance hell?",
      solution: "Simple translation management with a single source of truth.",
    },
    {
      id: "custom",
      icon: <Code className="w-6 h-6" />,
      title: "Custom Experiences",
      problem: "Need something unique without starting from zero?",
      solution: "Start with our foundation and extend with custom components.",
    },
  ];

  // Find active case
  const activeCase = useCases.find((useCase) => useCase.id === activeTab);

  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-4xl font-light mb-6">
            The Site You Need.{" "}
            <span className="text-emerald-400">No Compromises.</span>
          </h2>
          <p className="text-xl text-slate-300">
            Whatever you're building, you shouldn't have to choose between
            looking good, performing well, or updating easily. With Uniweb, you
            don't.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mb-12 overflow-x-auto">
          <div className="flex space-x-2 min-w-max pb-4">
            {useCases.map((useCase) => (
              <button
                key={useCase.id}
                onClick={() => setActiveTab(useCase.id)}
                className={`px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === useCase.id
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {useCase.icon}
                  <span>{useCase.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        {activeCase && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-800 rounded-xl p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-medium mb-3 text-emerald-400 flex items-center gap-3">
                    {activeCase.icon}
                    <span>{activeCase.title}</span>
                  </h3>
                  <p className="text-slate-300 mb-4 font-medium italic">
                    "{activeCase.problem}"
                  </p>
                  <p className="text-white text-lg">{activeCase.solution}</p>
                  <button className="mt-6 inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors group">
                    See an example
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="md:w-1/3 bg-slate-900 h-64 rounded-lg flex items-center justify-center">
                  {/* This would be an image or interactive preview */}
                  <p className="text-slate-500 text-sm">
                    Preview image for {activeCase.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-slate-400 mb-6">
            Don't see your specific use case? That's just the beginning of
            what's possible.
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors group">
            Explore all possibilities
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
