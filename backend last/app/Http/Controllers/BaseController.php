<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponseTrait;
use Illuminate\Routing\Controller as Controller;

class BaseController extends Controller
{
    use ApiResponseTrait;
}
