export default function Footer() {
  return (
    <footer className="mt-12 pb-8 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>© LSK Ranking</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <a
            href="https://www.strava.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold tracking-wider"
            style={{ color: "#fc4c02" }}
          >
            STRAVA
          </a>
        </div>
      </div>
    </footer>
  );
}
