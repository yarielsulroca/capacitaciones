<x-mail::message>
# Hola {{ $user->name }},

Queremos informarte que tu vacante solicitada para el curso **{{ $curso->nombre }}** ha sido confirmada.

Te esperamos el **{{ \Carbon\Carbon::parse($curso->inicio)->format('d/m/Y') }}** para esta actividad.

<x-mail::panel>
**Detalles del Curso:**
- **Curso:** {{ $curso->nombre }}
- **Fecha de inicio:** {{ \Carbon\Carbon::parse($curso->inicio)->format('d/m/Y') }}
- **Horas totales:** {{ $curso->cant_horas }}h
</x-mail::panel>

En caso de que quieras cancelar tu inscripción, por favor ingresá al portal de formación para liberar la vacante y que la misma pueda ser utilizada por otros.

---

### 📅 Agendá este curso en tu calendario

<x-mail::button :url="$googleCalendarUrl" color="primary">
📅 Agendar en Google Calendar
</x-mail::button>

<x-mail::button :url="$outlookCalendarUrl" color="success">
📅 Agendar en Outlook
</x-mail::button>

<small>También encontrarás un archivo adjunto **(.ics)** que podés abrir para agregar el evento a Apple Calendar, Thunderbird u otra app de calendario.</small>

---

<x-mail::button :url="config('app.url') . '/dashboard'">
Ver mis capacitaciones
</x-mail::button>

Cordialmente,<br>

Capital Humano
</x-mail::message>
