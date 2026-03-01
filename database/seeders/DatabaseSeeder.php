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
        // Ensure the Pagatpatan barangay record exists for registration gating
        $barangay = Barangay::updateOrCreate(
            ['name' => 'Barangay Pagatpatan'],
            [
                'city' => 'Butuan City',
                'province' => 'Agusan del Norte',
                'zip_code' => '8600',
                'description' => 'Official Barangay Pagatpatan community',
            ]
        );

        // Create admin user (idempotent for repeated seeds)
        User::updateOrCreate(
            ['email' => 'admin@barangaypgt.com'],
            [
                'name' => 'Barangay Pagatpatan Official Account',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'barangay_id' => $barangay->id,
                'phone' => '09171234567',
                'address' => 'Barangay Hall, Pagatpatan',
            ]
        );

        // Create sample resident (idempotent)
        User::updateOrCreate(
            ['email' => 'juan@example.com'],
            [
                'name' => 'Juan Dela Cruz',
                'password' => Hash::make('password123'),
                'role' => 'resident',
                'barangay_id' => $barangay->id,
                'phone' => '09179876543',
                'address' => '123 Main St, Barangay Pagatpatan',
            ]
        );
    }
}
