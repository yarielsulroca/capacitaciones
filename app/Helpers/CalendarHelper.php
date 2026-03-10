<?php

namespace App\Helpers;

use App\Models\Curso;
use Carbon\Carbon;

class CalendarHelper
{
    /**
     * Generate ICS (iCalendar) file content for a course.
     */
    public static function generateIcs(Curso $curso): string
    {
        $dtStart = self::formatDateIcs($curso->inicio);
        $dtEnd   = self::formatDateIcs($curso->fin ?? $curso->inicio);
        $now     = gmdate('Ymd\THis\Z');
        $uid     = 'curso-' . $curso->id . '@' . parse_url(config('app.url'), PHP_URL_HOST);

        $summary     = self::escapeIcs($curso->nombre);
        $description = self::escapeIcs(
            "Curso: {$curso->nombre}\n"
            . "Horas: {$curso->cant_horas}h\n"
            . ($curso->descripcion ? "Descripción: {$curso->descripcion}\n" : '')
            . ($curso->horarios ? "Horarios: " . self::formatHorarios($curso->horarios) . "\n" : '')
        );

        $horarioStr = $curso->horarios ? self::formatHorarios($curso->horarios) : '';
        $location   = self::escapeIcs($horarioStr);

        return implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Tuteur//Capacitaciones//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            "UID:{$uid}",
            "DTSTAMP:{$now}",
            "DTSTART;VALUE=DATE:{$dtStart}",
            "DTEND;VALUE=DATE:{$dtEnd}",
            "SUMMARY:{$summary}",
            "DESCRIPTION:{$description}",
            $location ? "LOCATION:{$location}" : '',
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            'DESCRIPTION:Recordatorio: ' . $summary,
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR',
        ]);
    }

    /**
     * Generate a Google Calendar "Add Event" URL.
     */
    public static function googleCalendarUrl(Curso $curso): string
    {
        $start = Carbon::parse($curso->inicio)->format('Ymd');
        $end   = Carbon::parse($curso->fin ?? $curso->inicio)->addDay()->format('Ymd');

        $params = http_build_query([
            'action'  => 'TEMPLATE',
            'text'    => $curso->nombre,
            'dates'   => "{$start}/{$end}",
            'details' => "Curso de capacitación: {$curso->nombre}\nHoras: {$curso->cant_horas}h"
                . ($curso->descripcion ? "\n{$curso->descripcion}" : ''),
            'sf'      => 'true',
        ]);

        return 'https://calendar.google.com/calendar/render?' . $params;
    }

    /**
     * Generate an Outlook Web "Add Event" URL.
     */
    public static function outlookCalendarUrl(Curso $curso): string
    {
        $start = Carbon::parse($curso->inicio)->toIso8601String();
        $end   = Carbon::parse($curso->fin ?? $curso->inicio)->addDay()->toIso8601String();

        $params = http_build_query([
            'rru'     => 'addevent',
            'subject' => $curso->nombre,
            'startdt' => $start,
            'enddt'   => $end,
            'body'    => "Curso: {$curso->nombre} | Horas: {$curso->cant_horas}h",
            'allday'  => 'true',
            'path'    => '/calendar/action/compose',
        ]);

        return 'https://outlook.live.com/calendar/0/deeplink/compose?' . $params;
    }

    // ---- Private helpers ----

    private static function formatDateIcs($date): string
    {
        return Carbon::parse($date)->format('Ymd');
    }

    private static function escapeIcs(string $text): string
    {
        return str_replace(["\r\n", "\n", ',', ';'], ['\\n', '\\n', '\\,', '\\;'], $text);
    }

    private static function formatHorarios($horarios): string
    {
        if (is_string($horarios)) {
            $horarios = json_decode($horarios, true);
        }
        if (!is_array($horarios)) return '';

        return collect($horarios)
            ->map(fn($h) => ($h['dia'] ?? '') . ' ' . ($h['hora'] ?? ''))
            ->implode(', ');
    }
}
