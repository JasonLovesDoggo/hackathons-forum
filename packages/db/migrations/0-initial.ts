import { Kysely } from 'kysely'
import { uuidColumnBuilder } from '../migrations-utils.js'

export async function up(db: Kysely<any>): Promise<void> {
  // Create categories table
  await db.schema
    .createTable('categories')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('snowflakeId', 'integer', (col) => col.notNull().unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .execute()

  // Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('snowflakeId', 'integer', (col) => col.notNull().unique())
    .addColumn('username', 'text', (col) => col.notNull())
    .addColumn('discriminator', 'varchar(4)', (col) => col.notNull())
    .addColumn('avatarUrl', 'text', (col) => col.notNull())
    .addColumn('joinedAt', 'date')
    .addColumn('isPrivate', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('answersCount', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('points', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('isModerator', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .execute()

  await db.schema
    .createIndex('users_snowflakeId_idx')
    .on('users')
    .column('snowflakeId')
    .execute()

  // Create channels table
  await db.schema
    .createTable('channels')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('snowflakeId', 'integer', (col) => col.notNull().unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('type', 'integer', (col) => col.notNull())
    .addColumn('topic', 'text', (col) => col.notNull())
    .addColumn('categoryId', 'uuid', (col) =>
      col.references('categories.id').onDelete('set null'),
    )
    .execute()

  await db.schema
    .createIndex('channels_categoryId_idx')
    .on('channels')
    .column('categoryId')
    .execute()

  // Create hackathons table
  await db.schema
    .createTable('hackathons')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('snowflakeId', 'integer', (col) => col.notNull().unique())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull())
    .addColumn('editedAt', 'timestamptz')
    .addColumn('channelId', 'uuid', (col) =>
      col.references('channels.id').onDelete('set null'),
    )
    .addColumn('isIndexed', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('lastActiveAt', 'timestamptz', (col) => col.notNull())
    .addColumn('archivedAt', 'timestamptz')
    .addColumn('archivedByUserId', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .execute()

  await db.schema
    .createIndex('hackathons_snowflakeId_idx')
    .on('hackathons')
    .column('snowflakeId')
    .execute()

  await db.schema
    .createIndex('hackathons_channelId_idx')
    .on('hackathons')
    .column('channelId')
    .execute()

  await db.schema
    .createIndex('hackathons_archivedByUserId_idx')
    .on('hackathons')
    .column('archivedByUserId')
    .execute()

  // Create messages table
  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('snowflakeId', 'integer', (col) => col.notNull().unique())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull())
    .addColumn('editedAt', 'timestamptz')
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('postId', 'uuid', (col) =>
      col.notNull().references('hackathons.id').onDelete('cascade'),
    )
    .addColumn('replyToMessageId', 'uuid', (col) =>
      col.references('messages.id').onDelete('set null'),
    )
    .execute()

  await db.schema
    .createIndex('messages_snowflakeId_idx')
    .on('messages')
    .column('snowflakeId')
    .execute()

  await db.schema
    .createIndex('messages_userId_idx')
    .on('messages')
    .column('userId')
    .execute()

  await db.schema
    .createIndex('messages_postId_idx')
    .on('messages')
    .column('postId')
    .execute()

  await db.schema
    .createIndex('messages_replyToMessageId_idx')
    .on('messages')
    .column('replyToMessageId')
    .execute()

  // Create attachments table
  await db.schema
    .createTable('attachments')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('snowflakeId', 'integer', (col) => col.notNull().unique())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('contentType', 'text')
    .addColumn('messageId', 'uuid', (col) =>
      col.notNull().references('messages.id').onDelete('cascade'),
    )
    .execute()

  await db.schema
    .createIndex('attachments_snowflakeId_idx')
    .on('attachments')
    .column('snowflakeId')
    .execute()

  await db.schema
    .createIndex('attachments_messageId_idx')
    .on('attachments')
    .column('messageId')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order to avoid constraint errors
  await db.schema.dropTable('attachments').execute()
  await db.schema.dropTable('messages').execute()
  await db.schema.dropTable('hackathons').execute()
  await db.schema.dropTable('channels').execute()
  await db.schema.dropTable('categories').execute()
  await db.schema.dropTable('users').execute()
}
