const Footer = () => {
  return (
    <footer className="mt-12 bg-gray-100 border-t border-gray-200 py-10">
      <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 px-4">
        <p className="text-base font-medium">
          &copy; {new Date().getFullYear()} ManReview. All rights reserved.
        </p>
        <div className="mt-4 flex justify-center space-x-6 text-blue-500 text-sm">
          <a href="/about" className="hover:underline">
            About
          </a>
          <a href="/contact" className="hover:underline">
            Contact
          </a>
          {/* <a href="/terms" className="hover:underline">
            Terms
          </a> */}
          <span className="text-gray-400 pointer-events-none select-none">
            Terms
          </span>
          <a
            href="https://github.com/trulyepic/man-review-frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
