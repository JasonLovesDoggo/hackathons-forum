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
} from 'discord.js'
import { env } from './env.js'
import {
  addFullPointsToUser,
  removeFullPointsFromUser,
  syncUser,
} from './db/actions/users.js'
import { tryToSetRegularMemberRole } from './lib/points.js'
import { unindexPost } from './db/actions/posts.js'

const START_INDEXING_AFTER = 1686438000000

export const isMessageInForumChannel = (
  channel: Channel,
): channel is Channel => {
  return (
    channel.type === ChannelType.GuildText &&
    env.INDEXABLE_CHANNEL_IDS.includes(channel.id)
  )
}

export const isMessageSupported = (message: Message) => {
  const isIndexable = message.createdAt.getTime() > START_INDEXING_AFTER
  return !message.author.bot && !message.system && isIndexable
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

export const LockPostWithReason = async (
  interaction: ChatInputCommandInteraction,
  reason: string,
) => {
  if (!interaction.channel) {
    await replyWithEmbedError(interaction, {
      description: 'This command can only be used in a supported channel',
    })
    return
  }

  await interaction.reply({ content: 'Ok!', ephemeral: true })

  await interaction.channel.send({
    embeds: [
      {
        color: Colors.Blue,
        title: '🔒 Post Locked',
        description: reason,
      },
    ],
  })
  await unindexPost(interaction.channel)
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

export const checkInvalidAnswer = async (
  interaction:
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction,
) => {
  if (!interaction.channel || !isMessageInForumChannel(interaction.channel)) {
    await replyWithEmbedError(interaction, {
      description: 'This command can only be used in a supported channel',
    })

    return
  }
  const mainChannel = interaction.channel

  if (!mainChannel) {
    await replyWithEmbedError(interaction, {
      description:
        'Could not find the channel, please try again later. If this issue persists, contact a staff member',
    })

    return
  }

  const interactionMember = await interaction.guild?.members.fetch(
    interaction.user,
  )
  if (!interactionMember) {
    await replyWithEmbedError(interaction, {
      description:
        'Could not find your info in the server, please try again later. If this issue persists, contact a staff member',
    })

    return
  }
  const channel = interaction.channel
  return { channel, interactionMember, mainChannel }
}
