<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            1 => 'admin',
            2 => 'student',
            3 => 'supervisor',
            4 => 'super_admin',
        ];

        foreach ($roles as $id => $name) {
            Role::updateOrCreate(['id' => $id], ['name' => $name]);
        }
    }
}
