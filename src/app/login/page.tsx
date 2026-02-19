interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  strava_denied: "Odmówiono dostępu do Stravy.",
  no_code: "Błąd autoryzacji. Spróbuj ponownie.",
  no_athlete: "Nie udało się pobrać profilu ze Stravy.",
  create_user_failed: "Błąd tworzenia konta.",
  callback_failed: "Błąd logowania. Spróbuj ponownie.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      {/* Glow bg */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">LSK Ranking</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Ścigaj się.<br />
            <span className="text-gradient-orange">Rywalizuj.</span>
          </h1>
          <p className="text-gray-600 text-sm mt-3">Ranking kolarski oparty na Stravie</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 border border-white/[0.08]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {errorMessages[error] || "Wystąpił błąd."}
            </div>
          )}

          <a
            href="/api/auth/strava"
            className="flex items-center justify-center gap-3 w-full gradient-orange text-white px-5 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Zaloguj przez Stravę
          </a>

          <p className="mt-4 text-xs text-center text-gray-700">
            Po zalogowaniu Twoje aktywności zostaną automatycznie zsynchronizowane.
          </p>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
            ← Wróć do rankingu
          </a>
        </div>
      </div>
    </div>
  );
}
