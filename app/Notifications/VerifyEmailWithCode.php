<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailWithCode extends Notification
{
    use Queueable;

    private $code;

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
                    ->subject('Verify Your Account - BarangayPGT')
                    ->greeting('Hello, ' . $notifiable->name . '!')
                    ->line('Your verification code is:')
                    ->line(new \Illuminate\Support\HtmlString('<div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-decoration: underline; margin: 20px 0;">' . $this->code . '</div>'))
                    ->line('This code will expire in 15 minutes.')
                    ->line('If you did not create an account, no further action is required.')
                    ->salutation('Regards, BarangayPGT');
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            //
        ];
    }
}
