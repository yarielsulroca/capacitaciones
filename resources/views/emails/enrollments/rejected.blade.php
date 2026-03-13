@component('mail::message')
Hola {{ $user->name }}

Queremos informarte que tu inscripción al curso **{{ $curso->nombre }}** no continuará en esta oportunidad, ya que tu líder indicó no avanzar con la inscripción en esta oportunidad.

Te sugerimos conversar con él/ella para conocer el contexto de esta decisión y evaluar juntos posibles alternativas de desarrollo o una futura participación en este u otros cursos.

Ante cualquier consulta, también podés contactar al equipo de Talento o a tu Business Partner.

Saludos,<br>
Capital Humano
@endcomponent
