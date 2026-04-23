export const metadata = {
  title: "Delete Account | Grindx AI",
  description: "Request deletion of your Grindx AI account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white sm:px-8">
            <h1 className="text-3xl font-bold tracking-tight">Delete Account</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
              Request deletion of your Grindx AI account and associated data.
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">How to request account deletion</h2>
              <p className="text-sm leading-7 text-slate-700 sm:text-base">
                To request deletion of your Grindx AI account and associated data,
                email us from your registered account email address at:
              </p>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900 sm:text-base">
                  info@insightxai.com.au
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Please include</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700 sm:text-base">
                <li>Your Grindx AI account email address</li>
                <li>Subject line: <span className="font-medium">Account Deletion Request</span></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">What happens next</h2>
              <p className="text-sm leading-7 text-slate-700 sm:text-base">
                Once we verify your request, we will process deletion of your Grindx AI
                account and associated data within 7 business days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Data retention exceptions</h2>
              <p className="text-sm leading-7 text-slate-700 sm:text-base">
                We may retain limited information where required for security, fraud
                prevention, legal compliance, dispute resolution, or enforcement of our
                agreements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Need help?</h2>
              <p className="text-sm leading-7 text-slate-700 sm:text-base">
                If you need help with your account deletion request, contact us at{" "}
                <a
                  href="mailto:info@insightxai.com.au"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  info@insightxai.com.au
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}