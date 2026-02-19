interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  strava_denied: "Odmówiono dostępu do Stravy. Spróbuj ponownie.",
  no_code: "Błąd autoryzacji Strava. Spróbuj ponownie.",
  no_athlete: "Nie udało się pobrać danych profilu ze Stravy.",
  create_user_failed: "Błąd podczas tworzenia konta. Spróbuj ponownie.",
  callback_failed: "Błąd logowania. Spróbuj ponownie.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Tytuł */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest uppercase text-gray-900 mb-2">
            LSK RANKING
          </h1>
          <p className="text-gray-500 text-sm">Ranking kolarski oparty na Stravie</p>
        </div>

        {/* Karta logowania */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            Zaloguj się
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              {errorMessages[error] || "Wystąpił błąd. Spróbuj ponownie."}
            </div>
          )}

          <a
            href="/api/auth/strava"
            className="flex items-center justify-center gap-3 w-full bg-strava text-white px-5 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Zaloguj przez Stravę
          </a>

          <p className="mt-4 text-xs text-center text-gray-400">
            Po zalogowaniu Twoje aktywności rowerowe zostaną automatycznie zsynchronizowane.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Wróć do rankingu
          </a>
        </div>
      </div>
    </div>
  );
}
