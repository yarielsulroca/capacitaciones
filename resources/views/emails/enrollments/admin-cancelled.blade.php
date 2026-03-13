@component('mail::message')
Hola {{ $user->name }}

Te informamos que en esta oportunidad tu solicitud para inscribirte al curso **{{ $curso->nombre }}** no pudo ser aprobada por el equipo de Capital Humano.

Esto puede deberse a motivos como disponibilidad de cupos u organización de la actividad.

Te invitamos a seguir explorando las propuestas disponibles en el Hub de Aprendizaje Tuteur y postularte a próximas ediciones u otras capacitaciones.

Muchas gracias por tu interés.

Cordialmente,

Capital Humano
@endcomponent
