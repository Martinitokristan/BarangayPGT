<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use App\Models\Barangay;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $barangayId = $request->user()->barangay_id;

        $stats = [
            'total_posts' => Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })->count(),
            'pending_posts' => Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })->where('status', 'pending')->count(),
            'in_progress_posts' => Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })->where('status', 'in_progress')->count(),
            'resolved_posts' => Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })->where('status', 'resolved')->count(),
            'urgent_posts' => Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })->where('urgency_level', 'high')->where('status', '!=', 'resolved')->count(),
            'total_residents' => User::where('role', 'resident')->when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })->count(),
            'total_barangays' => Barangay::count(),
        ];

        // Posts by purpose
        $stats['posts_by_purpose'] = Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })
            ->selectRaw('purpose, count(*) as count')
            ->groupBy('purpose')
            ->pluck('count', 'purpose');

        // Posts by urgency
        $stats['posts_by_urgency'] = Post::when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })
            ->selectRaw('urgency_level, count(*) as count')
            ->groupBy('urgency_level')
            ->pluck('count', 'urgency_level');

        // Recent urgent posts
        $stats['recent_urgent_posts'] = Post::with('user')
            ->when($barangayId, function($q) use ($barangayId) { return $q->where('barangay_id', $barangayId); })
            ->where('urgency_level', 'high')
            ->where('status', '!=', 'resolved')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json($stats);
    }

    public function users(Request $request)
    {
        $query = User::with('barangay');

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('barangay_id')) {
            $query->where('barangay_id', $request->barangay_id);
        }

        if ($request->has('is_approved')) {
            $query->where('is_approved', filter_var($request->is_approved, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function updateUserRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:resident,admin',
        ]);

        $user->update(['role' => $request->role]);

        return response()->json($user->load('barangay'));
    }

    public function approveUser(User $user)
    {
        $user->update(['is_approved' => true]);
        return response()->json(['message' => 'User approved successfully.', 'user' => $user->load('barangay')]);
    }

    public function rejectUser(User $user)
    {
        // Delete the uploaded ID images from storage if they exist
        if ($user->id_front_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->id_front_path);
        }
        if ($user->id_back_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->id_back_path);
        }
        
        $user->delete();
        return response()->json(['message' => 'User rejected and removed successfully.']);
    }

    public function barangays()
    {
        return response()->json(Barangay::withCount(['users', 'posts'])->get());
    }

    public function storeBarangay(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:barangays',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:10',
            'description' => 'nullable|string',
        ]);

        $barangay = Barangay::create($request->all());

        return response()->json($barangay, 201);
    }
}
