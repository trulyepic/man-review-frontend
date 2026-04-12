import { Link } from "react-router-dom";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentLabel: string;
  accentTitle: string;
  accentBody: string;
  highlights: string[];
  footerPrompt: string;
  footerLinkLabel: string;
  footerLinkTo: string;
  children: React.ReactNode;
};

const AuthShell = ({
  eyebrow,
  title,
  description,
  accentLabel,
  accentTitle,
  accentBody,
  highlights,
  footerPrompt,
  footerLinkLabel,
  footerLinkTo,
  children,
}: AuthShellProps) => {
  return (
    <div className="min-h-[calc(100vh-96px)] bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_42%,_#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(145deg,rgba(239,246,255,0.95),rgba(255,255,255,0.98)_52%,rgba(236,253,245,0.88))] px-6 py-7 sm:px-8 sm:py-9 lg:border-b-0 lg:border-r">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              {description}
            </p>

            <div className="mt-8 rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.38)]">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                {accentLabel}
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                {accentTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {accentBody}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-7 sm:px-8 sm:py-9">
          {children}

          <div className="mt-8 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
            {footerPrompt}{" "}
            <Link
              to={footerLinkTo}
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              {footerLinkLabel}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
