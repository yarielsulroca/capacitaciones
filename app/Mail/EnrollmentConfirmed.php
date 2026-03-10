<?php

namespace App\Mail;

use App\Helpers\CalendarHelper;
use App\Models\Curso;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public string $googleCalendarUrl;
    public string $outlookCalendarUrl;

    public function __construct(
        public User $user,
        public Curso $curso
    ) {
        $this->googleCalendarUrl  = CalendarHelper::googleCalendarUrl($curso);
        $this->outlookCalendarUrl = CalendarHelper::outlookCalendarUrl($curso);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Tu matrícula ha sido confirmada! - '.$this->curso->nombre,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.enrollments.confirmed',
        );
    }

    /**
     * Attach the .ics calendar file.
     */
    public function attachments(): array
    {
        $icsContent = CalendarHelper::generateIcs($this->curso);
        $filename   = 'curso-' . \Illuminate\Support\Str::slug($this->curso->nombre) . '.ics';

        return [
            \Illuminate\Mail\Mailables\Attachment::fromData(fn () => $icsContent, $filename)
                ->withMime('text/calendar'),
        ];
    }
}
