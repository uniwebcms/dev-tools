import React from "react";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
            Premium Websites, Simplified
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
            Uniweb CMS pairs premium component libraries with adaptable
            templates, so teams craft sophisticated, multilingual sites—while
            keeping content effortlessly up-to-date.
          </p>

          <div className="space-y-6">
            <button className="inline-flex items-center px-8 py-4 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors group">
              Choose a Free Template
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-sm text-slate-400">
              <em>
                Draft unlimited pages & languages. Pay only when you publish.
              </em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
