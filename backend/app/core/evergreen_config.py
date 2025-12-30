"""
Evergreen Event Organizer Profiles & Configuration
Defines branded organizers with consistent theming for evergreen events.
"""
from typing import Dict, List
from datetime import time

# 🎨 Organizer Profiles with Branding
EVERGREEN_ORGANIZERS = {
    "remos_bar": {
        "name": "Remo's Bar",
        "email": "events@remosbar.eventify",
        "full_name": "Jordan Martinez",  # Random name instead of "Remo Martinez"
        "brand_label": "Remo",
        "banner_emoji": "🍉",
        "banner_theme": "Watermelon Nights",
        "description": "New Year celebrations, Friday night vibes, and unforgettable parties",
        "categories": ["nightlife", "music", "entertainment"],
        "max_attendees": 400,
        "event_templates": [
            {
                "title": "Friday Night Fever at Remo's",
                "description": "Join us every Friday for live DJ sets, signature cocktails, and an electrifying atmosphere! Dance till dawn with the city's best crowd. 🍉✨",
                "category": "nightlife",
                "recurrence": "weekly_friday",
                "start_time": time(21, 0),
                "duration_hours": 4,
            },
            {
                "title": "New Year's Countdown Bash",
                "description": "Ring in the new year with style! Premium open bar, live music, and fireworks at midnight. Limited spots available. 🎆🥂",
                "category": "entertainment",
                "recurrence": "yearly_newyear",
                "start_time": time(22, 0),
                "duration_hours": 6,
            },
            {
                "title": "Sunset Social Hour",
                "description": "Unwind after work with craft cocktails, rooftop views, and great company. Every Thursday evening! 🌅🍹",
                "category": "nightlife",
                "recurrence": "weekly_thursday",
                "start_time": time(18, 30),
                "duration_hours": 3,
            },
        ],
    },
    
    "artfolk": {
        "name": "Artfolk Gallery",
        "email": "curator@artfolk.eventify",
        "full_name": "Avery Chen",  # Random name instead of "Elena Artfolk"
        "brand_label": "Artfolk",
        "banner_emoji": "🦋",
        "banner_theme": "Butterfly Dreams",
        "description": "Contemporary art shows, gallery openings, and cultural exhibitions",
        "categories": ["art", "culture", "education"],
        "max_attendees": 400,
        "event_templates": [
            {
                "title": "Contemporary Art Exhibition",
                "description": "Explore stunning contemporary works from emerging artists. Free wine & cheese, artist meet-and-greet included. 🦋🎨",
                "category": "art",
                "recurrence": "monthly_first_saturday",
                "start_time": time(17, 0),
                "duration_hours": 4,
            },
            {
                "title": "Photography Walk & Workshop",
                "description": "Capture the city's beauty with fellow photography enthusiasts. All skill levels welcome! 📸🌆",
                "category": "art",
                "recurrence": "biweekly_sunday",
                "start_time": time(10, 0),
                "duration_hours": 3,
            },
            {
                "title": "Art & Wine Night",
                "description": "Paint, sip, and socialize! No experience needed—just bring your creativity. All materials provided. 🍷🖌️",
                "category": "art",
                "recurrence": "weekly_wednesday",
                "start_time": time(19, 0),
                "duration_hours": 2.5,
            },
        ],
    },
    
    "cookingg": {
        "name": "Cookingg Collective",
        "email": "hello@cookingg.eventify",
        "full_name": "Riley Foster",  # Random name instead of "Chef Marco Cookingg"
        "brand_label": "Cookingg",
        "banner_emoji": "🍳",
        "banner_theme": "Pan & Fire",
        "description": "Food stalls, live cooking demos, and music-filled culinary experiences",
        "categories": ["food", "music", "community"],
        "max_attendees": 400,
        "event_templates": [
            {
                "title": "Street Food Festival",
                "description": "Taste the world in one place! 20+ food trucks, live bands, and family fun. Don't miss the taco competition! 🌮🎶",
                "category": "food",
                "recurrence": "monthly_third_saturday",
                "start_time": time(12, 0),
                "duration_hours": 6,
            },
            {
                "title": "Cooking Masterclass with Chef Marco",
                "description": "Learn professional techniques from a Michelin-trained chef. Includes full meal and recipe booklet. 👨‍🍳🔥",
                "category": "food",
                "recurrence": "biweekly_saturday",
                "start_time": time(15, 0),
                "duration_hours": 3,
            },
            {
                "title": "Brunch & Beats Sunday",
                "description": "Unlimited brunch buffet + live acoustic performances. Perfect way to end your weekend! 🥞🎸",
                "category": "food",
                "recurrence": "weekly_sunday",
                "start_time": time(11, 0),
                "duration_hours": 3,
            },
        ],
    },
    
    "giggling_university": {
        "name": "Giggling University",
        "email": "admin@gigglinguniversity.eventify",
        "full_name": "Morgan Brooks",  # Random name instead of "Dr. Sarah Giggling"
        "brand_label": "Giggling",
        "banner_emoji": "🎓",
        "banner_theme": "Book & Grad Hat",
        "description": "Workshops, talks, study groups, and all things learning",
        "categories": ["education", "networking", "business"],
        "max_attendees": 400,
        "event_templates": [
            {
                "title": "Career Development Workshop",
                "description": "Resume reviews, interview prep, and networking tips from industry professionals. Free for students! 📚💼",
                "category": "education",
                "recurrence": "monthly_second_wednesday",
                "start_time": time(18, 0),
                "duration_hours": 2,
            },
            {
                "title": "Tech Talk Thursday",
                "description": "Weekly tech talks on AI, blockchain, and emerging technologies. Q&A with speakers after. 💻🚀",
                "category": "education",
                "recurrence": "weekly_thursday",
                "start_time": time(19, 0),
                "duration_hours": 1.5,
            },
            {
                "title": "Study Group & Coffee",
                "description": "Collaborative study sessions with free coffee and snacks. Bring your laptop and questions! ☕📖",
                "category": "education",
                "recurrence": "weekly_tuesday",
                "start_time": time(16, 0),
                "duration_hours": 3,
            },
        ],
    },
    
    "daytona": {
        "name": "Daytona Racing Club",
        "email": "tickets@daytonaracing.eventify",
        "full_name": "Cameron Torres",  # Random name instead of "Mike Daytona"
        "brand_label": "Daytona",
        "banner_emoji": "🏍️",
        "banner_theme": "Speed & Adrenaline",
        "description": "Racing events, spectator experiences, and motorsport community",
        "categories": ["sports", "entertainment", "community"],
        "max_attendees": 400,
        "event_templates": [
            {
                "title": "Weekend Racing Spectator Pass",
                "description": "Watch pro racers compete in thrilling motorsport action! Includes pit lane tour and driver autographs. 🏁🏎️",
                "category": "sports",
                "recurrence": "monthly_last_sunday",
                "start_time": time(14, 0),
                "duration_hours": 5,
            },
            {
                "title": "Motorcycle Meetup & Ride",
                "description": "Join fellow riders for a scenic group ride through the countryside. All bike types welcome! 🏍️🛣️",
                "category": "sports",
                "recurrence": "biweekly_saturday",
                "start_time": time(9, 0),
                "duration_hours": 4,
            },
            {
                "title": "Racing Simulator Challenge",
                "description": "Compete in virtual racing tournaments with real prizes. No experience needed—just bring your competitive spirit! 🎮🏆",
                "category": "entertainment",
                "recurrence": "weekly_friday",
                "start_time": time(18, 0),
                "duration_hours": 3,
            },
        ],
    },
}

# 🔧 Evergreen System Configuration
EVERGREEN_CONFIG = {
    "pool_size": 15,              # Maintain 15 active events at all times
    "min_pool_size": 10,          # Alert if below 10 events
    "npc_per_event": 340,         # 85% filled with NPCs
    "max_capacity": 400,          # Total spots per event
    "available_spots": 60,        # 15% reserved for real users
    "cities": [
        "New York", "Los Angeles", "Chicago", "San Francisco", 
        "Austin", "Seattle", "Boston", "Denver"
    ],
}

# 📅 Recurrence Patterns (for future scheduling)
RECURRENCE_PATTERNS = {
    "weekly_monday": {"day": 0, "interval": 7},
    "weekly_tuesday": {"day": 1, "interval": 7},
    "weekly_wednesday": {"day": 2, "interval": 7},
    "weekly_thursday": {"day": 3, "interval": 7},
    "weekly_friday": {"day": 4, "interval": 7},
    "weekly_saturday": {"day": 5, "interval": 7},
    "weekly_sunday": {"day": 6, "interval": 7},
    "biweekly_saturday": {"day": 5, "interval": 14},
    "biweekly_sunday": {"day": 6, "interval": 14},
    "monthly_first_saturday": {"week": 1, "day": 5},
    "monthly_second_wednesday": {"week": 2, "day": 2},
    "monthly_third_saturday": {"week": 3, "day": 5},
    "monthly_last_sunday": {"week": -1, "day": 6},
    "yearly_newyear": {"month": 12, "day": 31},
}


def get_organizer_list() -> List[str]:
    """Return list of organizer keys."""
    return list(EVERGREEN_ORGANIZERS.keys())


def get_organizer_config(organizer_key: str) -> Dict:
    """Get configuration for a specific organizer."""
    return EVERGREEN_ORGANIZERS.get(organizer_key, {})


def get_all_event_templates() -> List[Dict]:
    """Get all event templates from all organizers."""
    templates = []
    for org_key, org_data in EVERGREEN_ORGANIZERS.items():
        for template in org_data.get("event_templates", []):
            templates.append({
                **template,
                "organizer_key": org_key,
                "organizer_name": org_data["name"],
                "organizer_email": org_data["email"],
                "max_attendees": org_data["max_attendees"],
                "banner_emoji": org_data["banner_emoji"],
            })
    return templates
