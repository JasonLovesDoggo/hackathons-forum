import {
  APIEmbed,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  Colors,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  MessageContextMenuCommandInteraction,
  TextChannel,
} from 'discord.js'
import { env } from './env.js'
import {
  addFullPointsToUser,
  removeFullPointsFromUser,
  syncUser,
} from './db/actions/users.js'
import { tryToSetRegularMemberRole } from './lib/points.js'

const START_INDEXING_AFTER = 1686438000000
export class HackathonChannel extends TextChannel {}

/**
 * Checks if a message is supported for indexing.
 * A message is supported if it is not from a bot, not a system message,
 * and was created after the specified indexing start time.
 *
 * @param {Message} message - The message to check.
 * @returns {boolean} - True if the message is supported, false otherwise.
 */
export const isMessageSupported = (message: Message): boolean => {
  const isIndexable = message.createdAt.getTime() > START_INDEXING_AFTER
  return !message.author.bot && !message.system && isIndexable
}

export const shouldProcessChannel = (channel: Channel): boolean => {
  return isChannelSupported(channel) && isChannelInHackathonCategory(channel)
}

export const isChannelSupported = (channel: Channel) => {
  return (
    channel.type !== ChannelType.GuildText &&
    channel.createdAt !== null &&
    channel.createdAt.getTime() > START_INDEXING_AFTER
  )
}

export const isChannelInHackathonCategory = (channel: Channel) => {
  return (
    channel.type === ChannelType.GuildText &&
    channel.parentId !== null &&
    env.INDEXABLE_CATEGORY_IDS.includes(channel.parentId)
  )
}

type Replyable = {
  reply: (content: InteractionReplyOptions) => Promise<InteractionResponse>
}

export const replyWithEmbed = (
  replyable: Replyable,
  { color = Colors.Blue, ...opts }: APIEmbed,
) => {
  return replyable.reply({
    embeds: [
      {
        color,
        ...opts,
      },
    ],
  })
}

export const replyWithEmbedError = (
  replyable: Replyable,
  { title = '❌ Error!', color = Colors.Red, ...opts }: APIEmbed,
) => {
  return replyable.reply({
    ephemeral: true,
    embeds: [
      {
        title,
        color,
        ...opts,
      },
    ],
  })
}

export const modifyRegularMemberRoles = async (
  interaction: ChatInputCommandInteraction,
  shouldAddPoints: boolean,
) => {
  const user = interaction.options.getUser('user', true)

  const guildMember = await interaction.guild?.members.fetch(user.id)

  if (!guildMember) {
    await interaction.reply({
      content: "I couldn't find the guild member from this user",
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply({ ephemeral: true })

  await syncUser(user, guildMember)
  if (shouldAddPoints) {
    await addFullPointsToUser(user.id)
  } else {
    await removeFullPointsFromUser(user.id)
  }
  await tryToSetRegularMemberRole(guildMember, true)

  await interaction.editReply({ content: 'Done!' })
}
