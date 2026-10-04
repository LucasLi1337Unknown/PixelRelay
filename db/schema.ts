import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {
 id: text('id').primaryKey(), handle: text('handle').notNull().unique(), name: text('name').notNull(), color: text('color').notNull(), bio: text('bio').notNull().default(''), createdAt: integer('created_at').notNull()
});
export const rooms = sqliteTable('rooms', {
 id: text('id').primaryKey(), kind: text('kind').notNull(), name: text('name').notNull(), description: text('description').notNull().default(''), owner: text('owner').notNull().references(()=>profiles.id), dmKey: text('dm_key').unique(), createdAt: integer('created_at').notNull()
});
export const members = sqliteTable('members', {
 roomId: text('room_id').notNull().references(()=>rooms.id), userId: text('user_id').notNull().references(()=>profiles.id)
},t=>[primaryKey({columns:[t.roomId,t.userId]}),index('idx_members_user').on(t.userId)]);
export const messages = sqliteTable('messages', {
 id: integer('id').primaryKey({autoIncrement:true}), roomId: text('room_id').notNull().references(()=>rooms.id), userId: text('user_id').notNull().references(()=>profiles.id), body: text('body').notNull(), nonce: text('nonce').notNull().unique(), createdAt: integer('created_at').notNull()
},t=>[index('idx_messages_room_id').on(t.roomId,t.id),index('idx_messages_user_time').on(t.userId,t.createdAt)]);
export const posts = sqliteTable('posts', {
 id: text('id').primaryKey(), userId: text('user_id').notNull().references(()=>profiles.id), body: text('body').notNull(), createdAt: integer('created_at').notNull()
},t=>[index('idx_posts_created').on(t.createdAt),index('idx_posts_user_time').on(t.userId,t.createdAt)]);
export const likes = sqliteTable('likes', {
 postId: text('post_id').notNull().references(()=>posts.id,{onDelete:'cascade'}), userId: text('user_id').notNull().references(()=>profiles.id)
},t=>[primaryKey({columns:[t.postId,t.userId]})]);

export const requests = sqliteTable('join_requests', {
 roomId:text('room_id').notNull().references(()=>rooms.id),userId:text('user_id').notNull().references(()=>profiles.id),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull()
},t=>[primaryKey({columns:[t.roomId,t.userId]})]);
export const presence=sqliteTable('presence',{userId:text('user_id').primaryKey().references(()=>profiles.id),seenAt:integer('seen_at').notNull()});
export const gameRooms=sqliteTable('game_rooms',{id:text('id').primaryKey(),name:text('name').notNull(),kind:text('kind').notNull(),owner:text('owner').notNull().references(()=>profiles.id),state:text('state').notNull(),version:integer('version').notNull().default(0),createdAt:integer('created_at').notNull()});
export const gamePlayers=sqliteTable('game_players',{roomId:text('room_id').notNull().references(()=>gameRooms.id),slot:integer('slot').notNull(),userId:text('user_id').notNull().references(()=>profiles.id),x:integer('x').notNull().default(400),y:integer('y').notNull().default(310),look:text('look').notNull().default('{}'),voice:integer('voice').notNull().default(0),seenAt:integer('seen_at').notNull()},t=>[primaryKey({columns:[t.roomId,t.slot]}),uniqueIndex('idx_game_user').on(t.roomId,t.userId)]);
export const gameEvents=sqliteTable('game_events',{id:integer('id').primaryKey({autoIncrement:true}),roomId:text('room_id').notNull().references(()=>gameRooms.id),userId:text('user_id').notNull().references(()=>profiles.id),kind:text('kind').notNull(),payload:text('payload').notNull(),createdAt:integer('created_at').notNull()},t=>[index('idx_game_events_room').on(t.roomId,t.id)]);
export const voiceSignals=sqliteTable('voice_signals',{id:integer('id').primaryKey({autoIncrement:true}),roomId:text('room_id').notNull(),sender:text('sender').notNull(),recipient:text('recipient').notNull(),payload:text('payload').notNull(),createdAt:integer('created_at').notNull()},t=>[index('idx_voice_recipient').on(t.roomId,t.recipient,t.id)]);
