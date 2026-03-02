<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoNotificationService
{
    protected $url = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send a notification to one or more users.
     *
     * @param string|array $to Single Expo push token or array of tokens
     * @param string $title
     * @param string $body
     * @param array $data Optional data payload
     * @return bool
     */
    public function send($to, $title, $body, $data = [])
    {
        if (empty($to)) {
            return false;
        }

        $messages = [];
        $recipients = is_array($to) ? $to : [$to];

        foreach ($recipients as $recipient) {
            if (empty($recipient))
                continue;

            $messages[] = [
                'to' => $recipient,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
            ];
        }

        if (empty($messages)) {
            return false;
        }

        try {
            $response = Http::post($this->url, $messages);

            if ($response->successful()) {
                return true;
            } else {
                Log::error('Expo Notification Error:', $response->json());
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Expo Notification Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to a specific user by their ID.
     */
    public function notifyUser($userId, $title, $body, $data = [])
    {
        $user = \App\Models\User::find($userId);
        if ($user && $user->push_token) {
            return $this->send($user->push_token, $title, $body, $data);
        }
        return false;
    }

    /**
     * Send notification to all users of a specific role.
     */
    public function notifyRole($role, $title, $body, $data = [])
    {
        $tokens = \App\Models\User::where('role', $role)
            ->whereNotNull('push_token')
            ->pluck('push_token')
            ->toArray();

        return $this->send($tokens, $title, $body, $data);
    }

    /**
     * Send notification to everyone.
     */
    public function notifyAll($title, $body, $data = [])
    {
        $tokens = \App\Models\User::whereNotNull('push_token')
            ->pluck('push_token')
            ->toArray();

        return $this->send($tokens, $title, $body, $data);
    }
}
