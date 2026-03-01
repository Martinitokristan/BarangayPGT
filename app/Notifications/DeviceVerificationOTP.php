<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DeviceVerificationOTP extends Notification
{
    use Queueable;

    public $code;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($code)
    {
        $this->code = $code;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->subject('New Device Verification Code - Barangay Online')
                    ->greeting('Hello ' . $notifiable->name . ',')
                    ->line('We noticed a login from an unrecognized device. To secure your account, please enter the following verification code:')
                    ->line(new \Illuminate\Support\HtmlString('<div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;"><h1 style="color: #2563eb; letter-spacing: 5px; margin: 0; font-size: 32px;">' . $this->code . '</h1></div>'))
                    ->line('This code will expire in 15 minutes.')
                    ->line('If you did not attempt to log in, please secure your account immediately.');
    }
}
