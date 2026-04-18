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
    <div className="min-h-[calc(100vh-96px)] bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_42%,_#f8fafc_100%)] px-4 py-5 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.08),_transparent_26%),linear-gradient(180deg,_#14110f_0%,_#191411_40%,_#1d1714_100%)] sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.35)] dark-theme-shell lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 relative overflow-hidden border-t border-slate-200/80 bg-[linear-gradient(145deg,rgba(239,246,255,0.95),rgba(255,255,255,0.98)_52%,rgba(236,253,245,0.88))] px-6 py-6 dark:border-[#322922] dark:bg-[linear-gradient(145deg,rgba(34,27,23,0.98),rgba(24,19,16,0.98)_52%,rgba(29,22,18,0.94))] sm:px-8 sm:py-8 lg:order-1 lg:border-r lg:border-t-0 lg:py-9">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
              {description}
            </p>

            <div className="mt-6 rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.38)] dark:border-[#3a3028] dark:bg-[linear-gradient(145deg,_rgba(34,28,24,0.84),_rgba(27,22,19,0.84))] dark:shadow-[0_18px_40px_-34px_rgba(0,0,0,0.75)]">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-[linear-gradient(145deg,_rgba(34,47,83,0.82),_rgba(24,31,55,0.82))] dark:text-blue-200 dark:ring-[#475276]">
                {accentLabel}
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {accentTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {accentBody}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-[#3a3028] dark:bg-[linear-gradient(145deg,_rgba(30,24,20,0.9),_rgba(22,18,15,0.9))] dark:text-[#d7c8ba]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 px-6 py-6 dark:bg-[linear-gradient(180deg,_rgba(26,21,18,0.88),_rgba(20,17,14,0.88))] sm:px-8 sm:py-8 lg:order-2 lg:py-9">
          {children}

          <div className="mt-8 border-t border-slate-200 pt-5 text-center text-sm text-slate-500 dark:border-[#3a3028] dark:text-slate-400">
            {footerPrompt}{" "}
            <Link
              to={footerLinkTo}
              className="font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
