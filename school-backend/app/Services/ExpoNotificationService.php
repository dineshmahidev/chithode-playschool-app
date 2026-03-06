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
        $recipients = is_array($to) ? $to : (empty($to) ? [] : [$to]);

        if (empty($recipients)) {
            return false;
        }

        $messages = [];
        foreach ($recipients as $recipient) {
            if (empty($recipient))
                continue;

            $message = [
                'to' => $recipient,
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'priority' => 'high',
                'ttl' => 3600,
                'channelId' => 'default',
            ];

            // Add root-level image for Android (Expo Push API)
            if (isset($data['image']) && !str_starts_with($data['image'], 'data:')) {
                $message['image'] = $data['image'];
            }

            if (!empty($data)) {
                $sanitizedData = (array) $data;
                // Expo rejects very large payloads. Base64 images are HUGE.
                if (isset($sanitizedData['image']) && str_starts_with($sanitizedData['image'], 'data:')) {
                    unset($sanitizedData['image']);
                }

                // Add standard image keys for both Android and iOS
                if (isset($data['image'])) {
                    $sanitizedData['image'] = $data['image'];
                    $sanitizedData['picture'] = $data['image'];
                    $sanitizedData['url'] = $data['image'];
                }

                $message['data'] = (object) $sanitizedData;

                // Add attachments for iOS parity
                if (isset($data['image']) && !str_starts_with($data['image'], 'data:')) {
                    $message['attachments'] = [
                        [
                            'url' => $data['image'],
                            'type' => 'image',
                            'hideThumbnail' => false
                        ]
                    ];
                    // Required for iOS notification service extensions to show images
                    $message['mutableContent'] = true;
                }
            }

            $messages[] = $message;
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
    public function notifyUser($userId, $title, $body, $data = [], $type = null)
    {
        // Try to find user by primary key (ID)
        $user = \App\Models\User::find($userId);

        // If not found, try searching by the custom 'student_id' field
        if (!$user) {
            $user = \App\Models\User::where('student_id', $userId)->first();
        }

        if ($user && $user->push_token) {
            // Check settings
            if (!$this->shouldNotify($user, $type)) {
                return false;
            }
            return $this->send($user->push_token, $title, $body, $data);
        }
        return false;
    }

    /**
     * Send notification to all users of a specific role.
     */
    public function notifyRole($role, $title, $body, $data = [], $type = null)
    {
        $users = \App\Models\User::where('role', $role)
            ->whereNotNull('push_token')
            ->get();

        $tokens = [];
        foreach ($users as $user) {
            if ($this->shouldNotify($user, $type)) {
                $tokens[] = $user->push_token;
            }
        }

        if (empty($tokens))
            return false;

        return $this->send($tokens, $title, $body, $data);
    }

    /**
     * Send notification to everyone.
     */
    public function notifyAll($title, $body, $data = [], $type = null)
    {
        $users = \App\Models\User::whereNotNull('push_token')
            ->get();

        $tokens = [];
        foreach ($users as $user) {
            if ($this->shouldNotify($user, $type)) {
                $tokens[] = $user->push_token;
            }
        }

        if (empty($tokens))
            return false;

        return $this->send($tokens, $title, $body, $data);
    }

    /**
     * Check if a user should receive a notification of a certain type
     */
    protected function shouldNotify($user, $type)
    {
        $settings = $user->notification_settings;

        // If no settings saved, default to ON for all
        if (!$settings) {
            return true;
        }

        // Global master toggle
        if (isset($settings['enabled']) && $settings['enabled'] === false) {
            return false;
        }

        // Specific type toggle
        if ($type && isset($settings[$type]) && $settings[$type] === false) {
            return false;
        }

        return true;
    }
}
