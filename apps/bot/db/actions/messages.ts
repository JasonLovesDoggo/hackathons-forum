import { Message, PartialMessage } from 'discord.js'
import { db, sql } from '@hackathons-forum/db/node'
import { addPointsToUser, removePointsFromUser, syncUser } from './users.js'
import { syncChannel, syncMessageChannel } from './channels.js'
import { updatePostLastActive } from './posts.js'
import { tryToSetRegularMemberRole } from '../../lib/points.js'

export const syncMessage = async (message: Message) => {
  const authorAsGuildMember = await message.guild?.members.fetch(
    message.author.id,
  )

  await Promise.all([
    syncUser(message.author, authorAsGuildMember),
    syncMessageChannel(message.channel),
    ...message.mentions.channels.mapValues((c) => syncChannel(c)),
    ...(message.mentions.members
      ? message.mentions.members.mapValues((m) => syncUser(m.user, m))
      : []),
  ])

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('messages')
      .values({
        snowflakeId: message.id,
        content: message.content,
        createdAt: message.createdAt,
        editedAt: message.editedAt,
        userId: message.author.id,
        postId: message.channelId,
        replyToMessageId: message.reference?.messageId,
      })
      .onConflict((oc) =>
        oc.column('snowflakeId').doUpdateSet({
          content: message.content,
          editedAt: message.editedAt,
        }),
      )
      .executeTakeFirst()

    await addPointsToUser(message.author.id, 'message', trx)

    await updatePostLastActive(message.channelId, trx)

    // Replace attachments
    if (message.attachments.size > 0) {
      await trx
        .deleteFrom('attachments')
        .where('messageId', '=', message.id)
        .execute()

      await trx
        .insertInto('attachments')
        .values(
          Array.from(message.attachments.values()).map((attachment) => ({
            snowflakeId: attachment.id,
            url: attachment.url,
            name: attachment.name,
            contentType: attachment.contentType,
            messageId: message.id,
          })),
        )
        .execute()
    }
  })

  if (authorAsGuildMember) {
    await tryToSetRegularMemberRole(authorAsGuildMember)
  }
}

export const deleteMessage = async (
  message: Message<boolean> | PartialMessage,
) => {
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('messages')
      .where('snowflakeId', '=', message.id)
      .executeTakeFirst()
    await trx
      .deleteFrom('attachments')
      .where('messageId', '=', message.id)
      .execute()

    await updatePostLastActive(message.channelId, trx)

    // If the message is partial we won't remove the points of the author
    // but that is fine since it's a very minor edge case and I don't think
    // doing a fetch here is worth it
    if (message.author?.id) {
      await removePointsFromUser(message.author.id, 'message', trx)
    }
  })
}
