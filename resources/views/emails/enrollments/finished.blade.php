<x-mail::message>
    # ¡Enhorabuena {{ $user->name }}!

    Has finalizado con éxito el curso: **{{ $curso->nombre }}**.

    Te felicitamos por completar esta capacitación y por tu compromiso con el desarrollo constante de tus habilidades
    profesionales.

    Tu certificado estará disponible próximamente en el portal.

    <x-mail::button :url="config('app.url') . '/dashboard'">
        Ver mis certificaciones
    </x-mail::button>

    Saludos,<br>
    {{ config('app.name') }}
</x-mail::message>
