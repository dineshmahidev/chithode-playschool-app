<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['title', 'description', 'media_type', 'media_url', 'thumbnail_url', 'date', 'author'];

    public function students()
    {
        return $this->belongsToMany(User::class , 'activity_student');
    }
}
