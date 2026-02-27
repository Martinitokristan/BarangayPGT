<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barangay;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Create default barangay
        $barangay = Barangay::create([
            'name' => 'Barangay PGT',
            'city' => 'Sample City',
            'province' => 'Sample Province',
            'zip_code' => '1000',
            'description' => 'Official Barangay PGT community',
        ]);

        // Create admin user
        User::create([
            'name' => 'Barangay Pagatpatan Official Account',
            'email' => 'admin@barangaypgt.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'barangay_id' => $barangay->id,
            'phone' => '09171234567',
            'address' => 'Barangay Hall, Pagatpatan',
        ]);

        // Create sample resident
        User::create([
            'name' => 'Juan Dela Cruz',
            'email' => 'juan@example.com',
            'password' => Hash::make('password123'),
            'role' => 'resident',
            'barangay_id' => $barangay->id,
            'phone' => '09179876543',
            'address' => '123 Main St, Barangay PGT',
        ]);
    }
}
