export default function Home() {
  return (
    <main className="flex flex-col">
          <header className="relative flex min-h-[60vh] items-center justify-center overflow-hidden pt-20 pb-10 md:pt-40 md:pb-20">
                <figure className="absolute inset-0 m-0">
                    <img
            src="/pictures/picture1.jpeg"
            alt="Arbeitsbereich an der FH JOANNEUM"
            className="h-full w-full object-cover brightness-50"
          />
          <figcaption className="sr-only">
            KAIT – Raumbuchungssystem der FH JOANNEUM
          </figcaption>
        </figure>

        <div className="relative max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-white text-center drop-shadow-lg sm:text-4xl lg:text-5xl">
            Willkommen bei dem
            <br />
            Raumbuchungssystem der
            <br />
            KAIT – FH JOANNEUM
          </h1>
        </div>
      </header>

      <section
        aria-labelledby="content-heading"
        className="mt-2 mb-12 flex justify-center px-4 sm:px-6 lg:px-8 pt-5 md:pt-10"
      >
        <div className="w-full max-w-4xl rounded-2xl bg-neutral-100 p-8 shadow-xl sm:p-10">
          <h2
            id="content-heading"
            className="text-xl font-semibold text-neutral-900 sm:text-2xl"
          >
            Über das Raumbuchungssystem
          </h2>

          <p className="mt-4 text-sm text-neutral-700 sm:text-base">
            Das Raumbuchungssystem der KAIT – FH JOANNEUM unterstützt
            Studierende sowie Mitarbeiterinnen und Mitarbeiter bei der einfachen
            Reservierung von Räumen und Ressourcen an der Hochschule.
          </p>
          <p className="mt-3 text-sm text-neutral-700 sm:text-base">
            Über die Startseite gelangen Sie schnell zu den wichtigsten
            Bereichen: Raumübersicht, Kalender und Anmeldebereich. Nach dem
            Einloggen können verfügbare Zeiten eingesehen, Buchungsanfragen
            erstellt und bestehende Reservierungen verwaltet werden.
          </p>
          <p className="mt-3 text-sm text-neutral-700 sm:text-base">
            Bitte melden Sie sich mit Ihren Zugangsdaten der FH JOANNEUM an, um
            alle Funktionen des Systems nutzen zu können.
          </p>
        </div>
      </section>
    </main>
  );
}
