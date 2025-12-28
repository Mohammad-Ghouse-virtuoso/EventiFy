import React, { useState, useEffect } from 'react';
import { MapPinIcon, CalendarIcon, UserGroupIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const CITIES = [
  "New York", "Los Angeles", "Chicago", "San Francisco", "Austin",
  "Seattle", "Boston", "Denver", "Miami", "Dallas"
];

const CATEGORIES = [
  { value: "", label: "All Categories", color: "bg-gradient-to-br from-purple-50 to-pink-50" },
  { value: "music", label: "Music", color: "bg-gradient-to-br from-rose-50 to-orange-50" },
  { value: "sports", label: "Sports", color: "bg-gradient-to-br from-blue-50 to-cyan-50" },
  { value: "tech", label: "Tech", color: "bg-gradient-to-br from-violet-50 to-purple-50" },
  { value: "food", label: "Food & Drink", color: "bg-gradient-to-br from-amber-50 to-yellow-50" },
  { value: "art", label: "Art & Culture", color: "bg-gradient-to-br from-pink-50 to-rose-50" },
  { value: "business", label: "Business", color: "bg-gradient-to-br from-slate-50 to-gray-50" }
];

export default function WhatsHappeningNow() {
  const [selectedCity, setSelectedCity] = useState("New York");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch existing events for selected city and category
  useEffect(() => {
    fetchEvents();
  }, [selectedCity, selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        location: selectedCity,
        limit: '9',
        include_past: 'false'
      });
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      const response = await fetch(`${API_BASE}/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        const rawEvents = Array.isArray(data) ? data : data?.events || [];

        // Normalize backend field names and de-duplicate by id
        const normalized = rawEvents.map((ev) => ({
          ...ev,
          image_url: ev.image_url || ev.image,
          start_time: ev.start_time || ev.event_start,
          attendees_count: ev.attendees_count ?? ev.attendees?.length ?? ev.attendee_count ?? 0,
        }));

        const seen = new Set();
        const uniqueEvents = [];
        for (const ev of normalized) {
          if (!ev?.id || seen.has(ev.id)) continue;
          seen.add(ev.id);
          uniqueEvents.push(ev);
        }

        // Keep a tight grid; prefer most recent first
        uniqueEvents.sort((a, b) => new Date(a.start_time || a.event_start || 0) - new Date(b.start_time || b.event_start || 0));
        setEvents(uniqueEvents.slice(0, 12));
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-b from-white via-purple-50/20 to-white py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Filter Toggle */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">
              What's Happening Now
            </h2>
            <p className="text-gray-600">Discover exciting events in your area</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
          >
            <FunnelIcon className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </button>
        </div>

        {/* Unified Filter Panel */}
        {showFilters && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* City Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <MapPinIcon className="h-4 w-4 text-purple-500" />
                  Location
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-0 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-purple-400/30 transition-all"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Category Pills */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <FunnelIcon className="h-4 w-4 text-purple-500" />
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory === cat.value
                          ? `${cat.color} border-2 border-purple-400 shadow-sm`
                          : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Finding events for you...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl border border-purple-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No events found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
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
