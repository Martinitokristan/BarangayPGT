<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('sex', ['male', 'female', 'other'])->nullable()->after('phone');
            $table->date('birth_date')->nullable()->after('sex');
            $table->unsignedTinyInteger('age')->nullable()->after('birth_date');
            $table->string('purok_address')->nullable()->after('address');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['sex', 'birth_date', 'age', 'purok_address']);
        });
    }
};
