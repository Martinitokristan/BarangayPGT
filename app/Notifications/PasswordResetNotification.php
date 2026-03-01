<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    public string $resetUrl;

    public function __construct(string $resetUrl)
    {
        $this->resetUrl = $resetUrl;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Password Reset Request – Barangay Online')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('We received a request to reset the password for your Barangay Online account.')
            ->action('Reset My Password', $this->resetUrl)
            ->line('This link will expire in **60 minutes**.')
            ->line('If you did not request a password reset, you can safely ignore this email — your password will not be changed.');
    }
}
