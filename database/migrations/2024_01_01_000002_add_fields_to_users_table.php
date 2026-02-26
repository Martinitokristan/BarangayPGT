<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFieldsToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['resident', 'admin'])->default('resident')->after('email');
            $table->foreignId('barangay_id')->nullable()->constrained('barangays')->onDelete('set null')->after('role');
            $table->string('phone')->nullable()->after('barangay_id');
            $table->text('address')->nullable()->after('phone');
            $table->string('avatar')->nullable()->after('address');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['barangay_id']);
            $table->dropColumn(['role', 'barangay_id', 'phone', 'address', 'avatar']);
        });
    }
}
