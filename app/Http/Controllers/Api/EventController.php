<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $events = Event::where('barangay_id', $user->barangay_id)
            ->with('creator:id,name,avatar')
            ->orderBy('event_date', 'asc')
            ->paginate(15);

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'event_date' => 'required|date',
            'image' => 'nullable|image|max:5120', // 5MB limit
        ]);

        $data = $request->except('image');
        $data['created_by'] = $user->id;
        $data['barangay_id'] = $user->barangay_id;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('events', 'public');
            $data['image'] = Storage::url($path);
        }

        $event = Event::create($data);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => $event
        ], 201);
    }

    public function show(Event $event)
    {
        if ($event->barangay_id !== Auth::user()->barangay_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $event->load('creator:id,name,avatar');
        return response()->json($event);
    }

    public function update(Request $request, Event $event)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' || $event->barangay_id !== $user->barangay_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'event_date' => 'required|date',
            'image' => 'nullable|image|max:5120',
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            // Delete old image
            if ($event->image) {
                $oldPath = str_replace('/storage/', '', $event->image);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('events', 'public');
            $data['image'] = Storage::url($path);
        }

        $event->update($data);

        return response()->json([
            'message' => 'Event updated successfully',
            'event' => $event
        ]);
    }

    public function destroy(Event $event)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' || $event->barangay_id !== $user->barangay_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($event->image) {
            $oldPath = str_replace('/storage/', '', $event->image);
            Storage::disk('public')->delete($oldPath);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }
}
