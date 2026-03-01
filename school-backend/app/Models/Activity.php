<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['title', 'description', 'media_type', 'media_url', 'thumbnail_url', 'date', 'author', 'likes_count'];

    public function students()
    {
        return $this->belongsToMany(User::class, 'activity_student');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
