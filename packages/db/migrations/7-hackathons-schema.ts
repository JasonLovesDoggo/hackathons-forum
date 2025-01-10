import { Kysely } from 'kysely'
import { SnowflakeDataType, uuidColumnBuilder } from '../migrations-utils.js'

export async function up(db: Kysely<any>): Promise<void> {
  // --- Categories
  await db.schema
    .createTable('categories')
    .addColumn('id', 'uuid', uuidColumnBuilder)
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .execute()

  // --- Channels
  await db.schema
    .alterTable('channels')
    .addColumn('categoryId', 'uuid', (col) => col.references('categories.id'))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('channels').dropColumn('categoryId').execute()
  await db.schema.dropTable('categories').execute()
}
