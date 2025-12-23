import React, { useState, useEffect } from 'react';
import { MapPinIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

// Sparkles icon as a simple inline SVG since heroicons doesn't have it
const SparklesIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L4 8v8l8 6 8-6V8l-8-6zm0 2l6 4v6l-6 4.5-6-4.5V8l6-4z"/>
  </svg>
);

const CITIES = [
  "New York", "Los Angeles", "Chicago", "San Francisco", "Austin",
  "Seattle", "Boston", "Denver", "Miami", "Dallas"
];

const CATEGORIES = [
  "music", "sports", "tech", "food", "art", "business"
];

export default function WhatsHappeningNow() {
  const [selectedCity, setSelectedCity] = useState("New York");
  const [selectedCategory, setSelectedCategory] = useState("music");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Fetch existing events for selected city
  useEffect(() => {
    fetchEvents();
  }, [selectedCity]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/events?location=${selectedCity}&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEvents = async () => {
    try {
      setGenerating(true);
      
      // Generate batch of events
      const response = await fetch(
        `/api/v1/ai/generate/events-batch?city=${selectedCity}&count=3`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Generated ${data.generated_count} events for ${selectedCity}`);
        
        // Refresh events list
        await fetchEvents();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to generate events'}`);
      }
    } catch (error) {
      console.error('Error generating events:', error);
      alert('Failed to generate events. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="bg-[#FAFAFA] py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-3">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">What's Happening Now</h2>
          </div>
          <p className="text-gray-500">Discover AI-powered events tailored to your interests</p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateEvents}
          disabled={generating}
          className="mb-8 flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="h-5 w-5" />
          <span>{generating ? 'Generating...' : 'Generate AI Events'}</span>
        </button>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 mb-4">No events found in {selectedCity}</p>
            <p className="text-sm text-gray-400">Generate AI-powered events to get started</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                  {/* Event Image */}
                  {event.image_url && (
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {event.category && (
                        <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {event.category}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    {/* Event Meta */}
                    <div className="space-y-2 border-t border-gray-100 pt-4">
                      {event.start_time && (
                        <div className="flex items-center space-x-2 text-gray-600 text-sm">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(event.start_time).toLocaleDateString()} at{' '}
                            {new Date(event.start_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center space-x-2 text-gray-600 text-sm">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.attendees_count && (
                        <div className="flex items-center space-x-2 text-gray-600 text-sm">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span>{event.attendees_count} attending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
