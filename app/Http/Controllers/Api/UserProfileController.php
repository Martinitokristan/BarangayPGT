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
}
