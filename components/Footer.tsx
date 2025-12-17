export default function Footer() {
    return (
    <footer className="w-full border-t border-gray-200 bg-white flex justify-center px-4 py-2 pl-7 sm:px-6 sm:py-5 sm:pl-70 transition-colors duration-300">
        <div className="mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 sm:px-14">
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide text-gray-800">
                IMPRESSUM
            </h1>

            <h2 className="mt-1 text-sm sm:text-base text-gray-700 font-medium">
                FH JOANNEUM GmbH, University of Applied Sciences
            </h2>
            
            <address className="mt-3 not-italic text-xs leading-5 sm:leading-5 text-gray-600">
                FH JOANNEUM GmbH, University of Applied Sciences<br />
                INSTITUTE Software Design and Security<br />
                Werk-VI-Straße 46<br />
                8605 Kapfenberg, AUSTRIA<br />
                T: +43 3862 6542-0<br />
                E: {""}
                <a href="mailto:info@joanneum.at" className="underline hover:text-green-700 transition-colors">
                    info@joanneum.at
                </a>
            </address>
            
            <p className="mt-3">
                <a href="https://www.fh-joanneum.at/hochschule/organisation/datenschutz/" 
                target="_blank" rel="noopener noreferrer"
                className="text-xs underline text-gray-600 hover:text-green-600 transition-colors">
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
