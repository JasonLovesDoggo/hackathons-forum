import { db, KyselyDB, TransactionDB } from '@hackathons-forum/db/node'
import { revalidateHomePage, revalidatePost } from '../../revalidate.js'
import { HackathonChannel } from '../../utils.js'

export const syncPost = async (channel: HackathonChannel) => {
  const now = new Date()
  await db
    .insertInto('hackathons')
    .values({
      snowflakeId: channel.id,
      title: channel.name,
      createdAt: channel.createdAt ?? now,
      editedAt: channel.createdAt ?? now,
      channelId: channel.parentId,
      lastActiveAt: now,
    })
    .onConflict((oc) =>
      oc.column('snowflakeId').doUpdateSet({
        title: channel.name,
        editedAt: now,
        lastActiveAt: now,
      }),
    )
    .executeTakeFirst()

  await revalidateHomePage()
}

export const deletePost = async (channel: HackathonChannel) => {
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('hackathons')
      .where('snowflakeId', '=', channel.id)
      .execute()
    await trx.deleteFrom('messages').where('postId', '=', channel.id).execute()
  })
}

export const updatePostLastActive = async (
  postId: string,
  trx: TransactionDB | KyselyDB = db,
) => {
  await trx
    .updateTable('hackathons')
    .where('snowflakeId', '=', postId)
    .set({ lastActiveAt: new Date() })
    .execute()
}

export const unindexPost = async (channel: HackathonChannel) => {
  await db
    .updateTable('hackathons')
    .where('snowflakeId', '=', channel.id)
    .set({ isIndexed: false })
    .execute()

  await revalidatePost(channel.id)
}
