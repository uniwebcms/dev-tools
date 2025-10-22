import React from "react";
import { Palette, Globe, BarChart3 } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: <Palette className="w-10 h-10" />,
      title: "Professional Design",
      description:
        "Premium components that make every page look professional—with no design skills required.",
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: "Multilingual, Naturally",
      description:
        "Create once, publish globally. Perfect translations without duplicating your work.",
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Intelligence Built In",
      description:
        "Self-hosted analytics reveal what content resonates, while keeping your data private.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-light text-center mb-16 text-slate-900 max-w-3xl mx-auto">
          Core Benefits That Make the Difference
        </h2>

        {/* Benefits with horizontal layout */}
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex-1 p-8 relative">
              {/* Divider between items (except last) */}
              {index < benefits.length - 1 && (
                <div className="hidden md:block absolute right-0 top-16 bottom-16 w-px bg-slate-200"></div>
              )}

              <div className="text-center">
                <div className="mx-auto text-slate-800 mb-6 bg-slate-50 p-6 rounded-full inline-flex items-center justify-center w-24 h-24">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-medium mb-4 text-slate-900">
                  {benefit.title}
                </h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
