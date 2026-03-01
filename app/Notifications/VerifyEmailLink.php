<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailLink extends Notification
{
    use Queueable;

    private string $spaUrl;

    public function __construct(string $spaUrl)
    {
        $this->spaUrl = $spaUrl;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify Your Email - BarangayPGT')
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email', $this->spaUrl)
            ->line('This link will expire in 60 minutes.')
            ->line('If you did not create an account, no further action is required.')
            ->salutation('Regards, BarangayPGT');
    }

    public function toArray($notifiable): array
    {
        return [];
    }
}
