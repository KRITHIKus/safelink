import React from "react";
import { useInView } from "react-intersection-observer";

const InfoSection = () => {
  const { ref: phishingRef, inView: phishingVisible } = useInView({ triggerOnce: true });
  const { ref: securityRef, inView: securityVisible } = useInView({ triggerOnce: true });
  const { ref: helpRef, inView: helpVisible } = useInView({ triggerOnce: true });

  return (
    <div className="mt-12 px-6">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
        Stay <span className="text-blue-500">Safe Online</span>
      </h2>

      {/* Phishing Awareness Section */}
      <div
        ref={phishingRef}
        className={`bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 mb-6 border-l-4 border-blue-500 transition-all duration-700 transform ${
          phishingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <img
          src="/assets/phishing-awareness.jpg"
          alt="Phishing Awareness"
          className="w-[80%] max-w-[400px] h-auto mx-auto rounded-lg object-contain sm:w-[60%] md:w-[50%] lg:w-[40%] hover:scale-105 transition-transform duration-300"
        />
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-4">
          <span className="text-blue-500">Phishing Awareness</span>
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Phishing attacks are one of the <strong>most common online threats</strong>. Cybercriminals attempt to trick users into providing <strong>sensitive information</strong> by disguising themselves as legitimate entities.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          <strong>Example:</strong> You receive an email that looks like it's from your bank, asking you to verify your account. Clicking the link may lead to a <strong>fake website</strong> designed to steal your login details.
        </p>
        <a
          href="https://www.cybersecurityguide.org/resources/phishing/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline mt-3 block transition-all duration-300 hover:text-blue-700"
        >
          Learn More About <strong>Phishing Attacks</strong>
        </a>
      </div>

      {/* Best Security Practices Section */}
      <div
        ref={securityRef}
        className={`bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 mb-6 border-l-4 border-green-500 transition-all duration-700 transform ${
          securityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <img
          src="/assets/a12.jpg"
          alt="Security Practices"
          className="w-[80%] max-w-[400px] h-auto mx-auto rounded-lg object-contain sm:w-[60%] md:w-[50%] lg:w-[40%] hover:scale-105 transition-transform duration-300"
        />
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-4">
          <span className="text-green-500">Best Security Practices</span>
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Protecting yourself online requires <strong>strong security habits</strong>. Using weak passwords, skipping software updates, and clicking unknown links can put your <strong>data at risk</strong>.
        </p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2">
          <li>Use <strong>strong, unique passwords</strong> for every account.</li>
          <li>Enable <strong>multi-factor authentication (MFA)</strong> wherever possible.</li>
          <li>Keep your <strong>system and apps updated</strong> to avoid vulnerabilities.</li>
        </ul>
        <a
          href="https://staysafeonline.org/stay-safe-online/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline mt-3 block transition-all duration-300 hover:text-blue-700"
        >
          More <strong>Cybersecurity Tips</strong>
        </a>
      </div>

      {/* How This Website Helps Section */}
      <div
        ref={helpRef}
        className={`bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 mb-6 border-l-4 border-yellow-500 transition-all duration-700 transform ${
          helpVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <img
          src="/assets/ai.jpg"
          alt="How This Website Helps"
          className="w-[80%] max-w-[400px] h-auto mx-auto rounded-lg object-contain sm:w-[60%] md:w-[50%] lg:w-[40%] hover:scale-105 transition-transform duration-300"
        />
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-4">
          <span className="text-yellow-500">How This Website Helps</span>
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Our tool <strong>scans websites for potential security risks</strong>, helping users identify and avoid <strong>malicious websites</strong>. By analyzing URLs, we help prevent <strong>phishing</strong> and other online scams.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Our system uses <strong>machine learning</strong> and <strong>threat intelligence APIs</strong> to detect harmful websites. We also integrate with <strong>trusted security databases</strong> for accurate results.
        </p>
        <a
          href="https://en.wikipedia.org/wiki/Website_security"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline mt-3 block transition-all duration-300 hover:text-blue-700"
        >
          Learn More About <strong>Website Security</strong>
        </a>
      </div>
    </div>
  );
};

export default InfoSection;
