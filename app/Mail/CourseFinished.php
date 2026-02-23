<?php

namespace App\Mail;

use App\Models\Curso;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CourseFinished extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Curso $curso
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Felicidades por finalizar tu curso! - ' . $this->curso->nombre,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.enrollments.finished',
        );
    }
}
