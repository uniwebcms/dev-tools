import React from "react";
import { ArrowRight, Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Enterprise-grade websites without an enterprise-sized team.",
      author: "Digital Director",
      company: "Global Technology Firm",
    },
    {
      quote: "Sophistication without complexity across all our departments.",
      author: "Web Services Manager",
      company: "University of Ottawa",
    },
    {
      quote: "Create once, customize effortlessly, deliver consistently.",
      author: "Lead Developer",
      company: "Digital Agency",
    },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <div className="flex justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-6 h-6 text-yellow-400 mx-1"
                fill="#facc15"
              />
            ))}
          </div>
          <h2 className="text-4xl font-light mb-6">Why Teams Love Uniweb</h2>
          <p className="text-slate-300">
            Join organizations that have transformed their digital presence
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-center h-20 mb-6 text-3xl font-serif text-slate-500">
                  "
                </div>
                <p className="text-white text-xl text-center font-light mb-8">
                  {testimonial.quote}
                </p>
                <div className="pt-4 border-t border-slate-700 text-center">
                  <p className="text-white font-medium">{testimonial.author}</p>
                  <p className="text-slate-400">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-6 mt-16">
          <button className="inline-flex items-center px-8 py-4 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors group">
            Choose a Free Template
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-medium hover:bg-slate-800 transition-colors group">
            Book a Demo
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
