export default function Footer() {
  return (
    <footer className="mt-16 pb-8 px-4 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto pt-6 flex items-center justify-between">
        <span className="text-xs text-gray-500">© LSK Ranking {new Date().getFullYear()}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Powered by</span>
          <a
            href="https://www.strava.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold tracking-wider text-orange-600 hover:text-orange-500 transition-colors"
          >
            STRAVA
          </a>
        </div>
      </div>
    </footer>
  );
}
