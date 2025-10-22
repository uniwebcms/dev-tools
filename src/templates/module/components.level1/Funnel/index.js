import React from "react";
import { ArrowRight, Building2, GraduationCap, Globe2 } from "lucide-react";

const SolutionsFunnel = () => {
  const solutions = [
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Business & Enterprise",
      description: "Build marketing sites and manage global content with ease.",
      cta: "Explore Business Solutions",
      href: "#business",
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Higher Education",
      description:
        "Create comprehensive academic ecosystems and faculty networks.",
      cta: "See Academic Options",
      href: "#education",
    },
    {
      icon: <Globe2 className="w-8 h-8" />,
      title: "Web Agencies",
      description: "Develop efficient, scalable websites for multiple clients.",
      cta: "View Developer Tools",
      href: "#agencies",
    },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-light text-center mb-4 text-slate-900">
          Looking for specialized solutions?
        </h2>
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-16">
          UniwebCMS works for projects of all kinds, but we've crafted tailored
          experiences for these specific needs:
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-200"
            >
              <div className="text-slate-700 mb-4">{solution.icon}</div>
              <h3 className="text-xl font-medium mb-3 text-slate-900">
                {solution.title}
              </h3>
              <p className="text-slate-600 mb-6">{solution.description}</p>
              <a
                href={solution.href}
                className="inline-flex items-center text-slate-900 font-medium hover:text-slate-600 transition-colors group"
              >
                {solution.cta}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          ))}
        </div>

        <p className="text-center mt-16 text-slate-600 italic">
          Or continue exploring our standard solution below...
        </p>
      </div>
    </section>
  );
};

export default SolutionsFunnel;
