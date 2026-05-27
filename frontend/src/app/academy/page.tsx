export const metadata = {
  title: "AI Practical Training | InsightXAI",
  description:
    "Face-to-face AI Practical Training in Tarneit covering Azure OpenAI, GPT-4o mini, RAG, OCR, Speech, Vision and GitHub Codespaces.",
};

export default function AcademyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-900 px-6 py-10 text-white sm:px-10 sm:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              InsightXAI Academy
            </p>

            <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
              AI Practical Training: Azure OpenAI & RAG
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              Face-to-face practical AI training in Tarneit. Learn Azure OpenAI,
              GPT-4o mini, RAG, OCR, Speech, Vision, GitHub Codespaces,
              Responsible AI and Content Safety by building working labs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#register"
                className="rounded-2xl bg-cyan-400 px-6 py-3 text-center text-sm font-bold text-slate-950 shadow-sm hover:bg-cyan-300"
              >
                Register Interest
              </a>
              <a
                href="https://grindx.insightxai.com.au"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              >
                Try GrindX AI
              </a>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-8 sm:px-10 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Location</p>
              <p className="mt-2 font-bold">Tarneit Community Learning Centre</p>
              <p className="mt-1 text-sm text-slate-600">
                150 Sunset Views Boulevard, Tarneit VIC 3029
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Easy access: free on-site parking available with no time limits.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Schedule</p>
              <p className="mt-2 font-bold">Thursday & Friday</p>
              <p className="mt-1 text-sm text-slate-600">
                18 June 2026 – 17 July 2026, 6:00 PM – 9:00 PM
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Fee</p>
              <p className="mt-2 font-bold">AUD $799</p>
              <p className="mt-1 text-sm text-slate-600">
                $199 deposit to reserve seat. Balance due by Friday, 3 July 2026.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">
              What You Will Learn
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 font-bold lg:grid-cols-3">
              {[
                "Azure account setup",
                "GitHub Codespaces",
                "Azure AI Foundry",
                "Azure OpenAI",
                "GPT-4o mini",
                "Prompting",
                "Embeddings",
                "RAG concepts",
                "OCR / Document Intelligence",
                "Speech to Text and Text to Speech",
                "Computer Vision",
                "Translation",
                "Responsible AI and Content Safety",
                "Basic deployment workflow",
                "Azure cost control basics",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">
              Practical Lab Focus
            </h2>

            <p className="mt-4 max-w-4xl leading-7 text-slate-700">
              Students will run guided Python labs using GitHub Codespaces, so no
              local Python or VS Code setup is required. The course includes
              practical Azure AI labs and certification-style concept reviews
              covering OCR, RAG, Speech, Vision, Responsible AI and Content
              Safety.
            </p>
          </div>


          <div className="grid gap-8 border-t border-slate-200 px-6 py-8 sm:px-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Who Should Join
              </h2>
          
              <div className="mt-4 grid font-bold gap-4">
                {[
                  "IT professional / Developer",
                  "Career switchers",
                  "Data analysts and business analysts",
                  "Secondary school, college and university students",
                  "Small business owners",
                  "Beginners who want practical AI skills",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                What You Need
              </h2>
          
              <div className="mt-4 font-bold grid gap-4">
                {[
                  "Laptop",
                  "Internet browser",
                  "Basic computer knowledge",
                  "Willingness to practise hands-on labs",
                  "GitHub account — setup guidance will be provided",
                  "Azure account — setup guidance will be provided",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    {item}
                  </div>
                ))}
              </div>
          
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Do not worry if you do not already have GitHub or Azure accounts.
                Setup guidance will be provided during the course.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">Career Pathway</h2>

            <div className="mt-4 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 shadow-sm">
              <p className="max-w-5xl text-lg font-semibold leading-9 text-slate-700">
                This course helps you to build practical project experience for
                future roles such as AI Developer, GenAI Application Support,
                AI Automation Assistant, Azure AI project roles, and AI-enabled
                business/data roles.
              </p>

              <p className="mt-6 max-w-4xl text-lg font-semibold leading-7 text-slate-700">
                Students can also use the completed labs and project work to
                discuss practical AI skills in resumes, interviews, and job
                applications.
              </p>
            </div>
          </div>




          <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">Trainer</h2>

            <p className="mt-4 max-w-4xl leading-7 text-slate-700">
              Delivered by <strong>InsightX Data & AI Solutions</strong>. This training is
              based on practical experience building and deploying{" "}
              <strong>GrindX AI</strong>, a live AI study application using Azure AI and
              document-aware AI workflows.
            </p>


            <p className="mt-3 max-w-4xl leading-7 text-slate-700">
              You can try uploading your own document and testing features such as 
			  document chat, summary, concepts, practice questions, mock tests, 
			  translation and listen/audio support.
            </p>


            <p className="mt-3">
              <a
                href="https://grindx.insightxai.com.au"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-cyan-400 px-6 py-3 text-center text-sm font-bold text-slate-950 shadow-sm hover:bg-cyan-300"
              >
                Try GrindX AI
              </a>

            </p>
          </div>

          <div
            id="register"
            className="border-t border-slate-200 bg-slate-900 px-6 py-10 text-white sm:px-10"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              Register Your Interest
            </h2>

            <p className="mt-4 max-w-3xl leading-7 text-slate-200">
              Founding Batch Fee: <strong>AUD $799</strong>. Seats are limited
              to 10–12 students only.
            </p>

            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <p className="text-sm text-slate-200">
                Complete the registration form and we will contact you with seat availability, payment details and next steps.
                link.
              </p>

              <a
                href="https://forms.gle/8GT3ueCaymNK3iJT9"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
              >
                Register Now
              </a>
            </div>
          </div>


          <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">Certificate</h2>

            <p className="mt-4 max-w-4xl leading-7 text-slate-700">
              Students receive an <strong>InsightXAI Certificate of Completion</strong>{" "}
              after completing the course. This training also supports learners
              who want to build practical skills for future Microsoft Azure AI
              certification pathways.
            </p>
          </div>

          <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">Contact Us</h2>


            <p className="mt-4 max-w-4xl leading-7 text-slate-700">
              Questions? Contact us at{" "}
              <a
                href="mailto:sdornal@insightxai.com.au"
                className="font-semibold text-cyan-700 hover:text-cyan-900"
              >
                sdornal@insightxai.com.au
              </a>{" "}
              or{" "}
              <a
                href="tel:+61450083125"
                className="font-semibold text-cyan-700 hover:text-cyan-900"
              >
                0450 083 125
              </a>
              .
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}