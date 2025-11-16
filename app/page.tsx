import Image from "next/image";

export default function Home() {
  return (
    <main>
      
      <header>
        <figure>
         
          <img src="/Bild1.PNG" alt="Arbeitsbereich an der FH JOANNEUM" />
          <figcaption>KAIT – Raumbuchungssystem der FH JOANNEUM</figcaption>
        </figure>

        <div>
          <h1>
            <br />
            <br />
            <br />
            Willkommen bei dem
            <br />
            Raumbuchungssystem der
            <br />
            KAIT – FH JOANNEUM
          </h1>
        </div>
      </header>

    
      <section aria-labelledby="content-heading">
        <h2 id="content-heading">Über das Raumbuchungssystem</h2>
        <p>
          Das Raumbuchungssystem der KAIT – FH JOANNEUM unterstützt Studierende
          und Mitarbeiterinnen sowie Mitarbeiter bei der einfachen Reservierung
          von Räumen und Ressourcen an der Hochschule.
        </p>
        <p>
          Über die Startseite gelangen Sie schnell zu den wichtigsten
          Bereichen: Raumübersicht, Kalender und Anmeldebereich. Nach dem
          Einloggen können verfügbare Zeiten eingesehen, Buchungsanfragen
          erstellt und bestehende Reservierungen verwaltet werden.
        </p>
        <p>
          Bitte melden Sie sich mit Ihren Zugangs­daten der FH JOANNEUM an, um
          alle Funktionen des Systems nutzen zu können.
        </p>
      </section>
    </main>
  );
}