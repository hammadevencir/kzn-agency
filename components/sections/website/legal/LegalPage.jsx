import React from "react";

/**
 * Simple long-form legal page (User Notice, Privacy Policy).
 *
 * @param {{
 *   title: string,
 *   updated: string,
 *   intro: string,
 *   sections: { heading: string, body: string[] }[],
 * }} props
 */
const LegalPage = ({ title, updated, intro, sections }) => {
  return (
    <section className="flex flex-col w-full items-center py-16 md:py-24 px-4 gradient-bg">
      <article className="w-full max-w-3xl flex flex-col gap-8">
        <header className="flex flex-col gap-3 text-center">
          <h1 className="text-2xl md:text-4xl font-bold font-syne text-white">
            {title}
          </h1>
          <p className="text-[#B0B0B0] text-xs">Last updated: {updated}</p>
          <p className="text-[#B0B0B0] text-sm md:text-base">{intro}</p>
        </header>

        <div className="flex flex-col gap-6 bg-tertiary rounded-2xl p-6 md:p-8 border border-primary/20">
          {sections.map((section) => (
            <div key={section.heading} className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-primary">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[#B0B0B0] text-sm leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

export default LegalPage;
