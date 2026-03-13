export default function AppLogo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    return (
        <>
            <img
                src="/logo_tuteur_transparente.png"
                alt="Tuteur"
                className="h-8 w-auto object-contain"
                style={variant === 'light' ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
            <div className="ml-1 flex-1 text-left text-sm">
                <span className={`mb-0.5 leading-tight font-semibold ${variant === 'dark' ? 'text-slate-800' : 'text-white'}`}>
                    Hub de Aprendizaje Tuteur (HAT)
                </span>
            </div>
        </>
    );
}

