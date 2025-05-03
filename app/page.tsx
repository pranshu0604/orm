import Image from 'next/image';

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 bg-gradient-to-b from-gray-900 to-black text-white font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-4xl mx-auto pt-8 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
          Online Reputation Manager
        </h1>
        <p className="mt-4 text-lg text-center text-gray-300">Your digital presence, expertly managed</p>
      </header>
      
      <main className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">What We Offer</h2>
          <ul className="space-y-3 list-inside list-disc text-gray-300">
            <li>Brand monitoring across all digital platforms</li>
            <li>Proactive content management and creation</li>
            <li>Crisis response and negative content suppression</li>
            <li>Personalized reputation enhancement strategies</li>
            <li>Real-time analytics and comprehensive reporting</li>
          </ul>
        </div>
        
        <div className="flex gap-6 items-center justify-center flex-col sm:flex-row mt-4">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-emerald-600 text-white gap-2 hover:bg-emerald-700 font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
            href="#contact"
          >
            Get Started
          </a>
          <a
            className="rounded-full border border-solid border-gray-600 transition-colors flex items-center justify-center hover:bg-gray-800 font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
            href="#about"
          >
            Learn More
          </a>
        </div>
      </main>
      
      <footer className="w-full max-w-4xl mx-auto pt-8 pb-4 text-center text-gray-400 text-sm">
        <p className="font-bold text-base">
          Built by <span className="text-emerald-400">The Notorious Pran</span>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} | All rights reserved
        </p>
      </footer>
    </div>
  );
}
