<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Post;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    /**
     * Get user profile with their posts
     */
    public function show(Request $request, User $user)
    {
        // Block residents from viewing admin profiles
        $currentUser = $request->user();
        if ($user->role === 'admin' && (!$currentUser || $currentUser->role !== 'admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Admin profiles are private and cannot be visited by residents.'
            ], 403);
        }

        $user->load(['barangay', 'followers.follower', 'following.following']);
        
        // Get user's posts
        $posts = Post::with(['user', 'comments.user', 'reactions.user'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Check if current user is following this user
        $isFollowing = false;
        $followSettings = [
            'notify' => false,
            'is_snoozed' => false,
        ];

        if ($request->user()) {
            $follow = $request->user()->following()->where('following_id', $user->id)->first();
            if ($follow) {
                $isFollowing = true;
                $followSettings = [
                    'notify' => $follow->notify,
                    'is_snoozed' => $follow->snoozed_until && $follow->snoozed_until->isFuture(),
                    'snoozed_until' => $follow->snoozed_until ? $follow->snoozed_until->toIso8601String() : null,
                ];
            }
        }

        return response()->json([
            'user' => $user,
            'posts' => $posts,
            'stats' => [
                'followers_count' => $user->followersCount(),
                'following_count' => $user->followingCount(),
                'posts_count' => $user->posts()->count(),
                'joined_date' => $user->created_at->format('M d, Y'),
            ],
            'is_following' => $isFollowing,
            'follow_settings' => $followSettings
        ]);
    }

    /**
     * Get user's posts only
     */
    public function posts(Request $request, User $user)
    {
        $posts = Post::with(['user', 'comments.user', 'reactions.user'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($posts);
    }

    /**
     * Follow/Unfollow a user
     */
    public function follow(Request $request, User $user)
    {
        $currentUser = $request->user();
        
        if ($currentUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'You cannot follow yourself'
            ], 400);
        }

        $isFollowing = $currentUser->following()->where('following_id', $user->id)->exists();

        if ($isFollowing) {
            // Unfollow
            $currentUser->following()->where('following_id', $user->id)->delete();
            $message = 'Unfollowed successfully';
            $isFollowing = false;
        } else {
            // Follow
            $currentUser->following()->create([
                'following_id' => $user->id,
                'notify' => false
            ]);
            $message = 'Followed successfully';
            $isFollowing = true;
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'is_following' => $isFollowing,
            'followers_count' => $user->followersCount(),
            'following_count' => $user->followingCount(),
        ]);
    }

    /**
     * Toggle follow notifications
     */
    public function toggleNotifications(Request $request, User $user)
    {
        $follow = $request->user()->following()->where('following_id', $user->id)->first();
        
        if (!$follow) {
            return response()->json(['error' => 'Not following this user'], 404);
        }

        $follow->update(['notify' => !$follow->notify]);

        return response()->json([
            'success' => true,
            'notify' => $follow->notify,
            'message' => $follow->notify ? 'Notifications enabled' : 'Notifications disabled'
        ]);
    }

    /**
     * Snooze follow for 30 days
     */
    public function snooze(Request $request, User $user)
    {
        $follow = $request->user()->following()->where('following_id', $user->id)->first();
        
        if (!$follow) {
            return response()->json(['error' => 'Not following this user'], 404);
        }

        $follow->update([
            'snoozed_until' => now()->addDays(30)
        ]);

        return response()->json([
            'success' => true,
            'snoozed_until' => $follow->snoozed_until->toIso8601String(),
            'message' => 'Snoozed for 30 days'
        ]);
    }
    /**
     * Update user profile photo
     */
    public function updateProfilePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:5120', // 5MB
        ]);

        $user = $request->user();
        
        if ($request->hasFile('photo')) {
            // Delete old avatar if it's not the default (if we had one)
            if ($user->avatar && str_contains($user->avatar, 'avatars/')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $user->avatar));
            }

            $path = $request->file('photo')->store('avatars', 'public');
            $user->update(['avatar' => '/storage/' . $path]);

            return response()->json([
                'success' => true,
                'avatar' => $user->avatar,
                'message' => 'Profile photo updated successfully'
            ]);
        }

        return response()->json(['error' => 'No photo provided'], 400);
    }

    /**
     * Update user cover photo
     */
    public function updateCoverPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:8192', // 8MB for covers
        ]);

        $user = $request->user();

        if ($request->hasFile('photo')) {
            // Delete old cover
            if ($user->cover_photo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $user->cover_photo));
            }

            $path = $request->file('photo')->store('covers', 'public');
            $user->update(['cover_photo' => '/storage/' . $path]);

            return response()->json([
                'success' => true,
                'cover_photo' => $user->cover_photo,
                'message' => 'Cover photo updated successfully'
            ]);
        }

        return response()->json(['error' => 'No photo provided'], 400);
    }
    /**
     * Search for users by name in the same barangay
     */
    public function search(Request $request)
    {
        $query = $request->get('query');
        if (!$query) {
            return response()->json([]);
        }

        $user = $request->user();
        $users = User::where('name', 'like', "%{$query}%")
            ->where('barangay_id', $user->barangay_id)
            ->where('role', '!=', 'admin')
            ->select('id', 'name', 'avatar', 'role')
            ->limit(10)
            ->get();

        return response()->json($users);
    }
}
