<x-mail::message>
    # ¡Felicidades {{ $user->name }}!

    Tu matrícula en el curso **{{ $curso->nombre }}** ha sido confirmada satisfactoriamente.

    Te esperamos el día **{{ \Carbon\Carbon::parse($curso->inicio)->format('d/m/Y') }}** para comenzar esta nueva etapa de aprendizaje.

    <x-mail::panel>
        **Detalles del Curso:**
        - **Curso:** {{ $curso->nombre }}
        - **Fecha de inicio:** {{ \Carbon\Carbon::parse($curso->inicio)->format('d/m/Y') }}
        - **Fecha de fin:** {{ \Carbon\Carbon::parse($curso->fin ?? $curso->inicio)->format('d/m/Y') }}
        - **Horas totales:** {{ $curso->cant_horas }}h
@if($curso->horarios && is_array($curso->horarios))
        - **Horarios:** @foreach($curso->horarios as $h){{ ($h['dia'] ?? '') . ' ' . ($h['hora'] ?? '') }}@if(!$loop->last), @endif @endforeach
@endif
    </x-mail::panel>

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

    Saludos,<br>
    {{ config('app.name') }}
</x-mail::message>
