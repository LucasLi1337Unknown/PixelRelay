-- One-time main-site fresh start authorized by Lucas. No beta records are imported.
DELETE FROM voice_signals;
--> statement-breakpoint
DELETE FROM game_events;
--> statement-breakpoint
DELETE FROM game_players;
--> statement-breakpoint
DELETE FROM game_rooms;
--> statement-breakpoint
DELETE FROM presence;
--> statement-breakpoint
DELETE FROM join_requests;
--> statement-breakpoint
DELETE FROM likes;
--> statement-breakpoint
DELETE FROM messages;
--> statement-breakpoint
DELETE FROM members;
--> statement-breakpoint
DELETE FROM posts;
--> statement-breakpoint
DELETE FROM rooms;
--> statement-breakpoint
DELETE FROM profiles;
--> statement-breakpoint
DELETE FROM sqlite_sequence WHERE name IN ('messages','game_events','voice_signals');
