<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pending_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('password');
            $table->unsignedBigInteger('barangay_id');
            $table->string('phone');
            $table->string('purok_address')->nullable(); // Only purok address
            $table->string('sex');
            $table->date('birth_date');
            $table->unsignedTinyInteger('age');
            $table->string('valid_id_path');
            $table->string('otp_code', 6);
            $table->timestamp('otp_expires_at');
            $table->string('device_token')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('pending_registrations');
    }
};
