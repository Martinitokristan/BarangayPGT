<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::with(['user', 'barangay', 'comments' => function($q) {
            $q->whereNull('parent_id')->with(['user', 'replies.user'])->orderBy('created_at', 'desc');
        }, 'reactions'])
            ->withCount(['comments', 'reactions']);

        // Filter by barangay
        if ($request->has('barangay_id')) {
            $query->where('barangay_id', $request->barangay_id);
        }

        // Filter by urgency
        if ($request->has('urgency_level')) {
            $query->where('urgency_level', $request->urgency_level);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by purpose
        if ($request->has('purpose')) {
            $query->where('purpose', $request->purpose);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Order: urgent posts first, then by latest
        $posts = $query->orderByRaw("FIELD(urgency_level, 'high', 'medium', 'low')")
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Hide admin_response from users who don't own the post (admins can always see)
        $currentUser = $request->user();
        $posts->getCollection()->transform(function ($post) use ($currentUser) {
            if ($currentUser && ($currentUser->isAdmin() || $currentUser->id === $post->user_id)) {
                return $post;
            }
            $post->makeHidden(['admin_response', 'responded_by', 'responded_at']);
            return $post;
        });

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'purpose' => 'required|in:complaint,problem,emergency,suggestion,general',
            'urgency_level' => 'required|in:low,medium,high',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $data = $request->only(['title', 'description', 'purpose', 'urgency_level']);
        $data['user_id'] = $request->user()->id;
        $data['barangay_id'] = $request->user()->barangay_id;
        $data['status'] = 'pending';

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create($data);

        // Notify admins about every new post
        $this->notifyNewPost($post);

        // If urgent, also notify all residents in the barangay
        if ($post->urgency_level === 'high') {
            $this->notifyUrgentPost($post);
        }

        return response()->json(
            $post->load(['user', 'barangay', 'comments' => function($q) {
                $q->whereNull('parent_id')->with(['user', 'replies.user'])->orderBy('created_at', 'desc');
            }, 'reactions']),
            201
        );
    }

    public function show(Request $request, Post $post)
    {
        $post->load(['user', 'barangay', 'comments' => function($q) {
            $q->whereNull('parent_id')->with(['user', 'replies.user'])->orderBy('created_at', 'desc');
        }, 'reactions'])
            ->loadCount(['comments', 'reactions']);

        // Hide admin_response from users who don't own the post (admins can always see)
        $currentUser = $request->user();
        if (!$currentUser || (!$currentUser->isAdmin() && $currentUser->id !== $post->user_id)) {
            $post->makeHidden(['admin_response', 'responded_by', 'responded_at']);
        }

        return response()->json($post);
    }

    public function update(Request $request, Post $post)
    {
        $user = $request->user();

        // Only the post owner or admin can update
        if ($user->id !== $post->user_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $rules = [];
        if ($user->id === $post->user_id) {
            $rules = [
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'purpose' => 'sometimes|in:complaint,problem,emergency,suggestion,general',
                'urgency_level' => 'sometimes|in:low,medium,high',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            ];
        }

        // Admin can update status and respond
        if ($user->isAdmin()) {
            $rules['status'] = 'sometimes|in:pending,in_progress,resolved';
            $rules['admin_response'] = 'sometimes|string';
        }

        $request->validate($rules);

        $data = $request->only(array_keys($rules));

        if ($request->hasFile('image')) {
            // Delete old image
            if ($post->image) {
                Storage::disk('public')->delete($post->image);
            }
            $data['image'] = $request->file('image')->store('posts', 'public');
        } elseif ($request->has('remove_image') && $request->remove_image) {
            // Remove existing image without replacing
            if ($post->image) {
                Storage::disk('public')->delete($post->image);
            }
            $data['image'] = null;
        }

        // Track admin response
        if ($user->isAdmin() && $request->has('admin_response')) {
            $data['responded_by'] = $user->id;
            $data['responded_at'] = now();
        }

        $post->update($data);

        // Notify resident if admin responded or changed status
        if ($user->isAdmin() && ($request->has('admin_response') || $request->has('status'))) {
            $this->notifyStatusUpdate($post);
        }

        return response()->json(
            $post->fresh()->load(['user', 'barangay', 'comments' => function($q) {
                $q->whereNull('parent_id')->with(['user', 'replies.user'])->orderBy('created_at', 'desc');
            }, 'reactions'])
        );
    }

    public function destroy(Request $request, Post $post)
    {
        $user = $request->user();

        if ($user->id !== $post->user_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($post->image) {
            Storage::disk('public')->delete($post->image);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted successfully']);
    }

    private function notifyNewPost(Post $post)
    {
        // Notify all admins about every new post
        $admins = User::where('role', 'admin')->get();
        $isUrgent = $post->urgency_level === 'high';
        $purposeLabel = ucfirst($post->purpose);
        $authorName = $post->user->name;

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'post_id' => $post->id,
                'type' => $isUrgent ? 'urgent_post' : 'new_post',
                'title' => $isUrgent
                    ? "🚨 URGENT: {$authorName} - {$purposeLabel}"
                    : "{$authorName} posted a {$purposeLabel}",
                'message' => $isUrgent
                    ? "{$authorName} posted an urgent {$purposeLabel}: \"{$post->title}\". Immediate attention required."
                    : "{$authorName} submitted a new {$purposeLabel} — \"{$post->title}\"",
            ]);
        }
    }

    private function notifyUrgentPost(Post $post)
    {
        // Notify residents in the same barangay (admins already notified via notifyNewPost)
        $residents = User::where('role', 'resident')
            ->where('barangay_id', $post->barangay_id)
            ->where('id', '!=', $post->user_id)
            ->get();
        $purposeLabel = ucfirst($post->purpose);
        $authorName = $post->user->name;

        foreach ($residents as $resident) {
            Notification::create([
                'user_id' => $resident->id,
                'post_id' => $post->id,
                'type' => 'urgent_post',
                'title' => "🚨 {$authorName} - Urgent {$purposeLabel}",
                'message' => "{$authorName} reported an urgent {$purposeLabel}: \"{$post->title}\"",
            ]);
        }
    }

    private function notifyStatusUpdate(Post $post)
    {
        $statusLabel = str_replace('_', ' ', ucfirst($post->status));

        Notification::create([
            'user_id' => $post->user_id,
            'post_id' => $post->id,
            'type' => 'status_update',
            'title' => "Post Update: {$statusLabel}",
            'message' => "Your post \"{$post->title}\" has been marked as {$statusLabel} by the admin.",
        ]);
    }
}
