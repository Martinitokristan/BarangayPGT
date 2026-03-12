<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use App\Models\Barangay;
use App\Models\Notification;
use App\Models\SmsLog;
use App\Services\Sms\SmsSender;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        $role = $request->query('role');
        $barangayId = $request->query('barangay_id');
        $isApprovedFilter = $request->query('is_approved');

        // Base query for existing users
        $query = User::with('barangay');

        if ($role) {
            $query->where('role', $role);
        }

        if ($barangayId) {
            $query->where('barangay_id', $barangayId);
        }

        // Apply strict approval filter if provided
        if ($isApprovedFilter !== null && $isApprovedFilter !== '') {
            $isApprovedBool = filter_var($isApprovedFilter, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_approved', $isApprovedBool);
        }

        // Get the paginated results for Users table
        $usersPaginator = $query->orderBy('created_at', 'desc')->paginate(20);

        // If we are looking for unapproved, or no specific filter (All Statuses),
        // we must check the PendingRegistration table too.
        if (($isApprovedFilter === '0' || $isApprovedFilter === '' || $isApprovedFilter === null) && (!$role || $role === 'resident')) {
            $pendingQuery = \App\Models\PendingRegistration::with('barangay')->whereNotNull('email_verified_at');
            
            if ($barangayId) {
                $pendingQuery->where('barangay_id', $barangayId);
            }

            $pendingRecords = $pendingQuery->orderBy('created_at', 'desc')->get();
            
            // Map pending records to match the User model structure for the frontend
            $transformedPending = $pendingRecords->map(function ($item) {
                $data = $item->toArray();
                $data['is_pending_registration'] = true;
                $data['is_approved'] = false;
                $data['role'] = 'resident';
                $data['barangay'] = $item->barangay;
                
                // Ensure valid_id_path has the pending prefix if folder is missing
                if ($item->valid_id_path && !str_starts_with($item->valid_id_path, 'resident_ids_pending/')) {
                    $data['valid_id_path'] = 'resident_ids_pending/' . $item->valid_id_path;
                }
                
                return $data;
            });

            // If we have pending users, prepend them to the collection of the current page.
            if ($transformedPending->isNotEmpty()) {
                $currentCollection = $usersPaginator->getCollection();
                // Concat is better than merge here to avoid ID collision overwrites
                $mergedCollection = $transformedPending->concat($currentCollection);
                $usersPaginator->setCollection($mergedCollection);
            }
        }

        return response()->json($usersPaginator);
    }

    public function updateUserRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:resident,admin',
        ]);

        $user->update(['role' => $request->role]);

        return response()->json($user->load('barangay'));
    }

    public function approveUser(Request $request, $id)
    {
        // 1. Check if it's a PendingRegistration waiting to be created
        $pending = \App\Models\PendingRegistration::find($id);

        if ($pending) {
            $originalPath = $pending->valid_id_path;
            
            // Normalize path for file movement
            $sourcePath = (str_starts_with($originalPath, 'resident_ids_pending/')) 
                ? $originalPath 
                : 'resident_ids_pending/' . $originalPath;
                
            $targetPath = str_replace('resident_ids_pending/', 'resident_ids/', $sourcePath);

            // Move the file if it exists
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($sourcePath)) {
                \Illuminate\Support\Facades\Storage::disk('public')->move($sourcePath, $targetPath);
                $finalPath = $targetPath;
            } elseif (\Illuminate\Support\Facades\Storage::disk('public')->exists($originalPath)) {
                \Illuminate\Support\Facades\Storage::disk('public')->move($originalPath, $targetPath);
                $finalPath = $targetPath;
            } else {
                // If file is missing, keep the relative path as target to avoid 404s if file is found later
                $finalPath = $targetPath;
            }

            $user = User::create([
                'name'              => $pending->name,
                'email'             => $pending->email,
                'password'          => $pending->password,
                'role'              => 'resident',
                'barangay_id'       => $pending->barangay_id,
                'phone'             => $pending->phone,
                'purok_address'     => $pending->purok_address,
                'sex'               => $pending->sex,
                'birth_date'        => $pending->birth_date,
                'age'               => $pending->age,
                'valid_id_path'     => $finalPath,
                'is_approved'       => true,
                'email_verified_at' => $pending->email_verified_at ?? now(),
            ]);

            if ($pending->device_token) {
                \App\Models\TrustedDevice::create([
                    'user_id' => $user->id,
                    'device_token' => $pending->device_token,
                    'device_name' => 'Registered Device',
                    'ip_address' => $request->ip() ?? '0.0.0.0',
                    'last_used_at' => now(),
                ]);
            }

            $pending->delete();
        } else {
            // 2. Fallback: it might already be an unapproved User
            $user = User::findOrFail($id);
            $user->update(['is_approved' => true]);
        }

        // Auto-send SMS notification to the approved user
        if ($user->phone) {
            try {
                $smsSender = new SmsSender();
                $message = "Hi {$user->name}! Your BarangayPGT account has been approved. You can now open the app and access all features. Welcome!";
                $result = $smsSender->send($user->phone, $message);

                SmsLog::create([
                    'admin_id'            => $request->user()->id,
                    'recipient_phone'     => $user->phone,
                    'message_content'     => $message,
                    'status'              => $result['success'] ? 'sent' : 'failed',
                    'provider_message_id' => $result['sid'] ?? null,
                    'error_message'       => isset($result['error']) ? substr($result['error'], 0, 255) : null,
                ]);
            } catch (\Exception $e) {
                Log::error('Approval SMS failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                // SMS failure doesn't block approval
            }
        }

        return response()->json([
            'message' => 'User approved successfully.',
            'user'    => $user->load('barangay'),
        ]);
    }

    public function rejectUser($id)
    {
        $pending = \App\Models\PendingRegistration::find($id);

        if ($pending) {
            if ($pending->valid_id_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pending->valid_id_path);
            }
            $pending->delete();
        } else {
            $user = User::findOrFail($id);
            if ($user->valid_id_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->valid_id_path);
            }
            $user->delete();
        }

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
