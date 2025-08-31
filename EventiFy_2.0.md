New updates and bugs in EventiFy 2.0.0.0: [2023-07-18]

1. http://127.0.0.1/dashboard - when Admin logs display the number at cards "Total attendees" currently it's NaN & why admin has to attend events, remove "Events attending" card.

More fixes:
- Inside events: Make hotkeys visible [Going, Maybe, Can't Go] for only logged in users. or else if unlogged user clicks any, prompt with login for fun! (like message). 
- Inside events: Users (attendee) shall mark all the events only use (for every page refresh) Eg., if Jane had clicked Going for Sarah & Mike's wedding make sure the hotkeys doesn't appear after the action. 

Database:
1. I can see the file is stored in local as eventify.db but I am looking forward to view it in sql workbench or PostgreSQL in live when data is being added or deleted. 

Design: 
1. The soul of app. I can see app. has no features like transitions, layout, colors, widgets or any motions. I need all from hovering on login to Going button use appropriate colors. Style and fonts. 
2. Fix the NavBar, it's in old style and add onHover effects and onClickEffects very subtly without making app into a punking wall. 
3. Add a footer page at the end mention few social links [keep empty for now]. 
4. Make the login page welcoming keep it immersive, it must have styles and all with fonts, transitions, images [if you describe me] and effects.

New issues:

1. The navbar is white in color so the header [It's mixing and causing blindness to user] fix with colors, current color is good but too bulk -- keep little subtle.
+
Change the landing page [Blue white theme] refine with new icons, themes and motions keep all app. native to one color family. As changing, can result in navbar fix. [which camouflaged]. 

2. Login & Sign UP is failing even with admin@eventify - [serious issue]. + I can see Login page is decorated and have good theme but signup page is in old world, bring back by adding good pastle colors or keep as login style. 

P.S - I have added screenshots for your ease on fixing this issue. 

Bugs and fixtures: 2.0.1
1. In attendee's dashboard the hotkeys are appearing for multiple actions. Eg. If I have selected "going" other options [maybe, can't go] shall be freeze. Only new events which listed shall appear with three action [Going, maybe, can't go] after appropriate action taken by user it freezes(disable) again. [Similarly as without login events]. 

BUG: I logged in as "Attendee" after a while I refreshed page it prompting create event - [Attendee can't create any events], fix this. [Initially I didn't get the message...] addition to remove cards of Events created, Total attendee's for attendee users.

small edit: Welcome back! <name> replace with Welcome <name>!

Important feature: The filter in all modes [attendee, admin] doesn't work. AT ALL! Category, Date and Location. 
Fixing idea: In default keep all events, when user selects category or any other option apply the results accordingly else prompt with "No events found matching your criteria"

After successful functioning of above:

We'll keep RSVP message from attendee's to users. 
I am unsure about QR generations -- provide any idea which feels suitable on this application. 
