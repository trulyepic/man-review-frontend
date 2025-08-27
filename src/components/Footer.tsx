import SocialLinks from "./SocialLinks";

const Footer = () => {
  return (
    <footer className="mt-12 bg-gray-100 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center text-sm text-gray-500">
          {/* Social */}
          <div className="mb-3 flex justify-center">
            <SocialLinks variant="footer" />
          </div>

          {/* Links */}
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 md:gap-x-4 text-blue-500 text-sm">
              <li>
                <a
                  href="/about"
                  className="px-1.5 py-0.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="px-1.5 py-0.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/report-issue"
                  className="px-1.5 py-0.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="/issues"
                  className="px-1.5 py-0.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Issues
                </a>
              </li>
              <li>
                <span className="px-1.5 py-0.5 text-gray-400 select-none">
                  Terms
                </span>
              </li>
              <li>
                <a
                  href="https://github.com/trulyepic/man-review-frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="/how-rankings-work"
                  className="px-1.5 py-0.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Ranks
                </a>
              </li>
            </ul>
          </nav>

          <p className="mt-3 text-sm">
            &copy; {new Date().getFullYear()} ToonRank. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
