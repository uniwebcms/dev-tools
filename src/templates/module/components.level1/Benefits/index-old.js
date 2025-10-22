import React from "react";
import { ArrowRight, Palette, Globe, BarChart3 } from "lucide-react";

const WhyTeamsLove = () => {
  const benefits = [
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Professional Design",
      description:
        "Your content flows freely while design remains consistently brilliant. Purpose-built component libraries ensure every page looks professional—whether it's your first or your thousandth.",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Multilingual, Naturally",
      description:
        "Transform once, publish globally. Uniweb handles translations with the same elegance as your primary content, maintaining structure across languages without duplicating effort.",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Intelligence Built In",
      description:
        "Beyond analytics—understand your content's impact through integrated insights. Self-hosted data means complete privacy while sophisticated tracking reveals what resonates.",
    },
  ];

  const testimonials = [
    {
      quote:
        "Finally, a CMS that matches our ambition. Uniweb lets us maintain enterprise-grade websites without an enterprise-sized team.",
      author: "Digital Director",
      company: "Global Technology Firm",
    },
    {
      quote:
        "At the University of Ottawa, we needed a system that could scale across departments while maintaining academic standards. Uniweb delivers sophistication without complexity.",
      author: "Web Services Manager",
      company: "University of Ottawa",
    },
    {
      quote:
        "Building multiple client sites used to mean juggling frameworks. With Uniweb, we create once, customize effortlessly, and deliver premium results consistently.",
      author: "Lead Developer",
      company: "Digital Agency",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-light text-center mb-20 text-slate-900">
          Why Teams Love Working with Uniweb
        </h2>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-12 max-w-7xl mx-auto mb-24">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="text-slate-900 mb-6 flex justify-center">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-medium mb-4 text-slate-900">
                {benefit.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-8">
                <p className="text-slate-700 mb-4 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="text-sm">
                  <p className="text-slate-900 font-medium">
                    {testimonial.author}
                  </p>
                  <p className="text-slate-600">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4">
          <button className="inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors group">
            Choose a Free Template
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="inline-flex items-center px-8 py-4 border-2 border-slate-900 text-slate-900 rounded-lg font-medium hover:bg-slate-900 hover:text-white transition-colors group">
            Book a Demo
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhyTeamsLove;
