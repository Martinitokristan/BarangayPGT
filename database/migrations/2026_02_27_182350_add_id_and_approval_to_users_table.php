<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIdAndApprovalToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('id_front_path')->nullable()->after('cover_photo');
            $table->string('id_back_path')->nullable()->after('id_front_path');
            $table->boolean('is_approved')->default(false)->after('id_back_path');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['id_front_path', 'id_back_path', 'is_approved']);
        });
    }
}
