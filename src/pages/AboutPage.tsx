// src/pages/AboutPage.tsx

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4">About Toon Ranks</h1>
      <p className="text-gray-700 mb-4 leading-relaxed">
        <strong>Toon Ranks</strong> is a fan-driven platform built for readers
        who love discovering and ranking the best
        <span className="font-medium text-blue-600"> Manhwa</span>,
        <span className="font-medium text-red-500"> Manga</span>, and
        <span className="font-medium text-green-600"> Manhua</span>. Whether
        you’re into epic fantasy, slice-of-life, drama, or action-packed
        adventures, this platform helps you find top-rated series and share your
        opinions.
      </p>
      <p className="text-gray-700 mb-4 leading-relaxed">
        Created by enthusiasts for enthusiasts, our goal is to provide a modern,
        community-powered experience that blends great UI, fair voting, and rich
        series detail.
      </p>
      <p className="text-gray-700 mb-4 leading-relaxed">
        Want to contribute or suggest improvements? Reach out via our{" "}
        <a href="/contact" className="text-blue-500 hover:underline">
          Contact page
        </a>{" "}
        or check out the project on{" "}
        <a
          href="https://github.com/yourgithub"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  );
};

export default AboutPage;
