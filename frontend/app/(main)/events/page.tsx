// ─── Pure Client Page ─────────────────────────────────────────────────────
// No server-side fetch → instant navigation.
// EventListClient handles its own data loading with useEffect + loading state.

import { Metadata } from 'next';
import EventListClient from '@/components/events/EventListClient';

export const metadata: Metadata = {
    title: 'Events | BarangayPGT',
    description: 'Upcoming events and community schedules in Barangay Pagatpatan.',
    openGraph: {
        title: 'Events | BarangayPGT',
        description: 'See the upcoming events hosted in Barangay Pagatpatan.',
        type: 'website',
    },
};

export default function EventsPage() {
    // No server-side fetch — EventListClient will fetch on mount via useEffect
    return <EventListClient initialEvents={[]} />;
}
