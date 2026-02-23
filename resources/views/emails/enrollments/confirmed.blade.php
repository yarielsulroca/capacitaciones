<x-mail::message>
    # ¡Felicidades {{ $user->name }}!

    Tu matrícula en el curso **{{ $curso->nombre }}** ha sido confirmada satisfactoriamente.

    Te esperamos el día **{{ $curso->inicio }}** para comenzar esta nueva etapa de aprendizaje.

    <x-mail::panel>
        **Detalles del Curso:**
        - **Fecha de inicio:** {{ $curso->inicio }}
        - **Horas totales:** {{ $curso->cant_horas }}h
        - **CDC:** {{ $curso->cdc->cdc }}
    </x-mail::panel>

    <x-mail::button :url="config('app.url') . '/dashboard'">
        Ver detalles del curso
    </x-mail::button>

    Saludos,<br>
    {{ config('app.name') }}
</x-mail::message>
