import { db } from '@hackathons-forum/db/node'
import { channelsCache } from '../../lib/cache.js'
import { Channel, ChannelType } from 'discord.js'
import { baseLog } from '../../log.js'
import { isChannelInHackathonCategory } from '../../utils.js'

const log = baseLog.extend('channels')

export const syncChannel = async (channel: Channel) => {
  const isCached = channelsCache.get(channel.id)
  if (isCached) return

  const isGuildBasedChannel = 'guild' in channel
  if (!isGuildBasedChannel) return

  const topic = 'topic' in channel ? channel.topic : null

  await db
    .insertInto('channels')
    .values({
      snowflakeId: channel.id,
      name: channel.name,
      type: channel.type,
      topic: topic ?? '',
    })
    .onConflict((oc) =>
      oc.column('snowflakeId').doUpdateSet({
        name: channel.name,
        topic: topic ?? '',
      }),
    )
    .executeTakeFirst()

  log('Synced channel (#%s)', channel.name)
  channelsCache.set(channel.id, true)
}
