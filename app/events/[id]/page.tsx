import { EventDetailPage } from '@/components/events/EventDetailPage'

export default function EventPage({ params }: { params: { id: string } }) {
  return <EventDetailPage eventId={params.id} />
}