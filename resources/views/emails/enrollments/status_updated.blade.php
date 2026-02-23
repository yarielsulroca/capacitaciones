<x-mail::message>
    # Hola {{ $user->name }},

    Te informamos que el estado de tu capacitación en el curso **{{ $curso->nombre }}** ha sido actualizado a:
    **{{ ucfirst($statusName) }}**.

    Si tienes alguna duda sobre esta actualización, por favor contacta con el equipo de Capital Humano.

    <x-mail::button :url="config('app.url') . '/dashboard'">
        Ver mis capacitaciones
    </x-mail::button>

    Gracias,<br>
    {{ config('app.name') }}
</x-mail::message>
