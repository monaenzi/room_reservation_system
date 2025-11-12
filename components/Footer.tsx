export default function Footer() {
    return (
    <footer className="w-full border-t shadow-sm bg-white flex justify-center">
        <div className="mx-auto max-w-3xl px-6 py-14">
            <h1 className="text-xl font-semibold tracking-wide text-gray-800">
                IMPRESSUM
            </h1>

            <h2 className="mt-1 text-base text-gray-700 font-medium">
                FH JOANNEUM GmbH, University of Applied Sciences
            </h2>
            
            <address className="mt-3 not-italic text-xs leading-6 text-gray-600">
                FH JOANNEUM GmbH, University of Applied Sciences<br />
                INSTITUTE Software Design and Security<br />
                Werk-VI-Straße 46<br />
                8605 Kapfenberg, AUSTRIA<br />
                T: +43 3862 6542-0<br />
                E: <a href="mailto:info@joanneum.at" className="underline">info@joanneum.at</a>
            </address>
            
            <p className="mt-3">
                <a href="https://www.fh-joanneum.at/hochschule/organisation/datenschutz/" className="text-xs underline text-gray-600">
                Data protection FH JOANNEUM
                </a>
            </p>
            <div className="mt-4 flex justify-start">
                <span className="inline-block rounded-md bg-slate-100 px-3 py-1 text-[10px] text-gray-500">
                    No liability is assumed for linked content.
                </span>
            </div>
        </div>
    </footer>
    );
}
