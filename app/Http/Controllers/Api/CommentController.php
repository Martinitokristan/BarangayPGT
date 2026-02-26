<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommentController extends Controller
{
    public function index(Post $post)
    {
        $comments = $post->comments()
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, Post $post)
    {
        $request->validate([
            'body' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'body' => $request->body,
            'parent_id' => $request->parent_id,
            'liked_by' => [],
        ]);

        // Notify the post owner if commenter is different
        if ($post->user_id !== $request->user()->id) {
            $commenterName = $request->user()->name;
            Notification::create([
                'user_id' => $post->user_id,
                'post_id' => $post->id,
                'type' => 'new_comment',
                'title' => "{$commenterName} commented on your post",
                'message' => "{$commenterName} said: \"" . Str::limit($request->body, 80) . "\" on \"{$post->title}\"",
            ]);
        }

        // If replying, notify the parent comment owner
        if ($request->parent_id) {
            $parentComment = Comment::find($request->parent_id);
            if ($parentComment && $parentComment->user_id !== $request->user()->id) {
                $replierName = $request->user()->name;
                Notification::create([
                    'user_id' => $parentComment->user_id,
                    'post_id' => $post->id,
                    'type' => 'new_comment',
                    'title' => "{$replierName} replied to your comment",
                    'message' => "{$replierName} replied: \"" . Str::limit($request->body, 80) . "\" on \"{$post->title}\"",
                ]);
            }
        }

        return response()->json($comment->load(['user', 'replies.user']), 201);
    }

    public function update(Request $request, Post $post, Comment $comment)
    {
        if ($request->user()->id !== $comment->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment->update(['body' => $request->body]);

        return response()->json($comment->load(['user', 'replies.user']));
    }

    public function destroy(Request $request, Post $post, Comment $comment)
    {
        $user = $request->user();

        if ($user->id !== $comment->user_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    public function toggleLike(Request $request, Post $post, Comment $comment)
    {
        $userId = $request->user()->id;
        $likedBy = $comment->liked_by ?? [];

        if (in_array($userId, $likedBy)) {
            $likedBy = array_values(array_filter($likedBy, fn($id) => $id !== $userId));
        } else {
            $likedBy[] = $userId;
        }

        $comment->update(['liked_by' => $likedBy]);

        return response()->json([
            'liked_by' => $likedBy,
            'likes_count' => count($likedBy),
            'user_liked' => in_array($userId, $likedBy),
        ]);
    }
}
