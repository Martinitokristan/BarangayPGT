<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reaction;
use App\Models\Post;
use Illuminate\Http\Request;

class ReactionController extends Controller
{
    public function toggle(Request $request, Post $post)
    {
        $validator = \Validator::make($request->all(), [
            'type' => 'required|in:Like,heart,support,sad',
        ]);

        if ($validator->fails()) {
            \Log::error('Reaction validation failed', [
                'post_id' => $post->id,
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all(),
                'user_id' => $request->user() ? $request->user()->id : 'guest'
            ]);
            return response()->json($validator->errors(), 422);
        }

        $existing = Reaction::where('post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            if ($existing->type === $request->type) {
                // Remove reaction (toggle off)
                $existing->delete();
                return response()->json([
                    'message' => 'Reaction removed',
                    'reactions' => $this->getReactionSummary($post),
                    'user_reaction' => null,
                ]);
            } else {
                // Change reaction type
                $existing->update(['type' => $request->type]);
                return response()->json([
                    'message' => 'Reaction updated',
                    'reactions' => $this->getReactionSummary($post),
                    'user_reaction' => $request->type,
                ]);
            }
        }

        // Create new reaction
        Reaction::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'type' => $request->type,
        ]);

        return response()->json([
            'message' => 'Reaction added',
            'reactions' => $this->getReactionSummary($post),
            'user_reaction' => $request->type,
        ], 201);
    }

    private function getReactionSummary(Post $post)
    {
        return $post->reactions()
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');
    }
}
