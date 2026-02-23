<x-mail::message>
    # Hola {{ $user->name }},

    Te informamos que tu solicitud o matrícula en el curso **{{ $curso->nombre }}** ha sido **Cancelada**.

    Si tienes alguna duda sobre esta decisión, por favor contacta con tu responsable directo o con el equipo de Capital
    Humano.

    <x-mail::button :url="config('app.url') . '/dashboard'">
        Ver otros cursos
    </x-mail::button>

    Atentamente,<br>
    {{ config('app.name') }}
</x-mail::message>
