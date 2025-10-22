import React from "react";
import {
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Layout,
  PenTool,
  Eye,
  Rocket,
} from "lucide-react";

const ExperienceNow = () => {
  const steps = [
    {
      number: "1",
      icon: <Layout className="w-5 h-5" />,
      title: "Choose Template",
    },
    {
      number: "2",
      icon: <PenTool className="w-5 h-5" />,
      title: "Write & Configure",
    },
    {
      number: "3",
      icon: <Eye className="w-5 h-5" />,
      title: "Preview Live",
    },
    {
      number: "4",
      icon: <Rocket className="w-5 h-5" />,
      title: "Publish Ready",
    },
  ];

  const benefits = [
    {
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      text: "Free subdomain",
      detail: "(yoursite.uniweb.site)",
    },
    {
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      text: "Custom domain ready",
      detail: "(bring or buy)",
    },
    {
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      text: "No learning curve",
      detail: "- familiar editing",
    },
    {
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      text: "Pay only when you publish",
      detail: "",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-100 to-white">
      <div className="container mx-auto px-4">
        {/* Experience Band */}
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-24">
          <div className="bg-slate-900 text-white py-8 px-8">
            <h2 className="text-3xl font-light">
              Experience Uniweb—free, in under a minute.
            </h2>
          </div>

          <div className="p-8">
            {/* Step Tracker */}
            <div className="relative mb-16">
              <div className="hidden md:block absolute left-16 top-8 h-0.5 w-full -z-10 bg-slate-200" />
              <div className="flex flex-col md:flex-row justify-between md:space-x-12 md:px-8">
                {steps.map((step, index) => (
                  <div key={index} className="relative mb-8 md:mb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium text-xl mb-4 shadow-md">
                        {step.number}
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-900 font-medium">
                          {step.icon}
                          <span>{step.title}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-slate-700"
                >
                  {benefit.icon}
                  <span className="font-medium">{benefit.text}</span>
                  {benefit.detail && (
                    <span className="text-slate-500 text-sm">
                      {benefit.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Demo Button */}
            <div className="text-center">
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors font-medium">
                <PlayCircle className="w-5 h-5 text-slate-900" />
                Watch the 60-Second Build Demo
              </button>
            </div>
          </div>
        </div>

        {/* Final CTA Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-12 text-center text-white shadow-xl">
          <h3 className="text-3xl font-light mb-8">
            Ready to craft your premium presence?
          </h3>

          <button className="inline-flex items-center px-10 py-4 bg-white text-slate-900 rounded-lg font-medium text-lg hover:bg-slate-100 transition-colors group mb-6 shadow-md">
            Choose a Free Template
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-slate-300 mt-2">
            <em>
              Unlimited drafts & languages. Publish from $20/mo when ready.
            </em>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExperienceNow;
