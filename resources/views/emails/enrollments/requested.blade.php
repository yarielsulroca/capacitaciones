<x-mail::message>
# Hola {{ $user->name }},

Recibimos tu solicitud para inscribirte al curso: **{{ $curso->nombre }}**.

Tu solicitud está siendo actualmente Procesada por el equipo de Capital Humano.

En cuanto tengamos la confirmación, te haremos llegar un mail informándote para que agendes la actividad. Pero si en el transcurso de los próximos días, queres cancelar tu solicitud, podrás hacerlo desde el portal de Capacitación Tuteur

Muchas gracias por tu interés.

{{ config('app.name') }}
</x-mail::message>
