<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReactionsTable extends Migration
{
    public function up()
    {
        Schema::create('reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['like', 'support', 'urgent', 'sad', 'angry']);
            $table->timestamps();

            $table->unique(['post_id', 'user_id']); // one reaction per user per post
        });
    }

    public function down()
    {
        Schema::dropIfExists('reactions');
    }
}
