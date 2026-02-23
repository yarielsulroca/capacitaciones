<x-mail::message>
# Hola {{ $user->name }},

Has enviado una solicitud para inscribirte en el curso: **{{ $curso->nombre }}**.

Tu solicitud está siendo actualmente **Procesada** por el equipo de Administración y Capital Humano.

Te informaremos a la brevedad sobre el estado de tu matrícula.

<x-mail::button :url="config('app.url') . '/dashboard'">
Ver mis solicitudes
</x-mail::button>

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
