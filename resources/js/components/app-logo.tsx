import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-white text-primary">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-1 flex-1 text-left text-sm">
                <span className="mb-0.5 leading-tight font-semibold text-white">
                    Hub de Aprendizaje Tuteur (HAT)
                </span>
            </div>
        </>
    );
}
