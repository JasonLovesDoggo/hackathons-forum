import { Colors, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../types.js'
import { replyWithEmbed } from '../../utils.js'
import { db, sql } from '@hackathons-forum/db/node'
import { baseLog } from '../../log.js'

const log = baseLog.extend('refresh-last-active')

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('refresh-last-active')
    .setDescription(
      'Refreshes the last active time for every post (expensive call so only use it if really necessary)',
    )

    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await replyWithEmbed(interaction, {
      title: '⌛ Processing...',
      description:
        'Your request has been queued. This might take a while to complete...',
    })

    try {
      log('Loading all posts with dates...')

      // update posts with lastmod time
      const hackathons = await db
        .selectFrom('hackathons')
        .select([
          'hackathons.snowflakeId',
          sql<Date>`MAX(IFNULL(hackathons.editedAt, hackathons.createdAt))`.as(
            'lastModTime',
          ),
          sql<Date>`MAX(IFNULL(messages.editedAt, messages.createdAt))`.as(
            'lastMessageModTime',
          ),
        ])
        .leftJoin('messages', 'hackathons.snowflakeId', 'messages.postId')
        .groupBy('hackathons.snowflakeId')
        .execute()

      log('Loaded %d posts, starting transaction chunks', hackathons.length)

      const chunkSize = 100
      for (let i = 0; i < hackathons.length; i += chunkSize) {
        const chunk = hackathons.slice(i, i + chunkSize)

        log('Executing transaction chunk %d', i / chunkSize)

        await db.transaction().execute(async (trx) => {
          for (const hackathon of chunk) {
            const lastActive =
              hackathon.lastMessageModTime > hackathon.lastModTime
                ? hackathon.lastMessageModTime
                : hackathon.lastModTime

            await trx
              .updateTable('hackathons')
              .where('hackathons.snowflakeId', '=', hackathon.snowflakeId)
              .set({ lastActiveAt: lastActive })
              .execute()
          }
        })

        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      log('Transaction completed')

      await interaction.editReply({
        embeds: [
          {
            title: '✅ Success!',
            description: 'The answer count of the users has been updated',
            color: Colors.Green,
          },
        ],
      })
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Unknown reason'

      await interaction.editReply({
        embeds: [
          {
            title: 'Error',
            description,
          },
        ],
      })
    }
  },
}
