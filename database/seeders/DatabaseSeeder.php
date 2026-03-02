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
            []
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
                'purok_address' => 'Barangay Hall, Pagatpatan',
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
                'purok_address' => 'Purok 1, Barangay Pagatpatan',
            ]
        );
    }
}
