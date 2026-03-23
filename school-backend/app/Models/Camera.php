<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Camera extends Model
{
    protected $fillable = ['name', 'device_id', 'stream_id', 'url', 'proxy_path', 'status'];
}
