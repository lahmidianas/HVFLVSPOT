import { EventList } from '@/components/events/EventList'
import { Hero } from '@/components/home/Hero'
import { FeaturedEvents } from '@/components/home/FeaturedEvents'
import { Categories } from '@/components/home/Categories'

export default function Home() {
  return (
    <div>
      <Hero />
      <Categories />
      <FeaturedEvents />
      <EventList />
    </div>
  )
}