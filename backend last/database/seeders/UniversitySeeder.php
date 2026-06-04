<?php

namespace Database\Seeders;

use App\Models\University;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UniversitySeeder extends Seeder
{
    public function run(): void
    {
        $defaultName = env('DEFAULT_UNIVERSITY_NAME', 'Legacy');

        $defaultUni = University::firstOrCreate(
            ['name' => $defaultName],
            ['slug' => 'legacy']
        );

        University::firstOrCreate(
            ['name' => 'Test University B'],
            ['slug' => 'test-b']
        );

        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin']);

        User::firstOrCreate(
            ['email' => 'superadmin@pms.local'],
            [
                'name'          => 'Platform Admin',
                'password'      => 'password',
                'role_id'       => $superAdminRole->id,
                'university_id' => $defaultUni->id,
                'status'        => 'active',
            ]
        );
    }
}
