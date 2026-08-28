const SOCIAL = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/101634457/',
    path: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/fabrixproject/',
    path: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </>
    ),
  },
];

/**
 * Logos and funding acknowledgement are aligned on fabrixproject.eu and reviewed
 * by the project officer: the FABRIX mark, the EU emblem with "Funded by the
 * European Union", and the grant disclaimer **in full**. Do not shorten the
 * disclaimer or drop either logo.
 */
export function SiteFooter() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-8 md:items-start">
            <div className="flex flex-col gap-3">
              <img src="/fabrix-logo.svg" alt="FABRIX" className="h-6 w-auto self-start" />
              <p className="text-sm text-muted-foreground max-w-sm">
                Fostering sustainable urban manufacturing in textile and clothing ecosystems
              </p>
            </div>

            <div className="md:ml-auto flex flex-col gap-4 md:items-end">
              <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <a href="https://www.fabrixproject.eu/about" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">About</a>
                <a href="https://www.fabrixproject.eu/news" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">News</a>
                <a href="https://learn.fabrixproject.eu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Learning Hub</a>
                <a href="https://www.fabrixproject.eu/contact" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Contact</a>
              </nav>
              <div className="flex gap-2">
                {SOCIAL.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`FABRIX on ${social.label}`}
                    className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {social.path}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-border pt-6">
            <img src="/flag-of-europe.svg" alt="Flag of Europe" className="h-9 w-auto flex-none rounded-[3px]" />
            <div className="max-w-3xl">
              <p className="text-sm font-semibold">Funded by the European Union</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                FABRIX has received funding from the European Union&rsquo;s Horizon Europe Programme,
                under grant agreement No. 101135638. Views and opinions expressed are however those of
                the author(s) only and do not necessarily reflect those of the European Union or HaDEA.
                Neither the European Union nor the granting authority can be held responsible for them.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
            <a href="https://www.fabrixproject.eu/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Privacy policy
            </a>
            <a href="https://www.fabrixproject.eu/privacy-policy/cookies" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Cookies policy
            </a>
            <span className="ml-auto">&copy; {new Date().getFullYear()} FABRIX</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
