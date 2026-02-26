<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePostsTable extends Migration
{
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('barangay_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('purpose', ['complaint', 'problem', 'emergency', 'suggestion', 'general']);
            $table->enum('urgency_level', ['low', 'medium', 'high'])->default('low');
            $table->enum('status', ['pending', 'in_progress', 'resolved'])->default('pending');
            $table->string('image')->nullable();
            $table->text('admin_response')->nullable();
            $table->foreignId('responded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('posts');
    }
}
