import {
  ApplicationCommandType,
  ButtonStyle,
  ChannelType,
  Colors,
  ComponentType,
  ContextMenuCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js'
import { ContextMenuCommand } from '../types.js'
import {
  checkInvalidAnswer,
  isMessageSupported,
  replyWithEmbed,
  replyWithEmbedError,
} from '../../utils.js'
import { markMessageAsUseful } from '../../db/actions/messages.js'
import { env } from '../../env.js'
import { tryToSetRegularMemberRole } from '../../lib/points.js'

export const command: ContextMenuCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Mark Useful')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    if (!isMessageSupported(interaction.targetMessage)) {
      await replyWithEmbedError(interaction, {
        description:
          "This type of message is not supported. Make sure the author isn't a bot and the post is indexed",
      })

      return
    }

    const isValidAnswer = await checkInvalidAnswer(interaction)
    if (!isValidAnswer) return
    const { channel, interactionMember, mainChannel } = isValidAnswer

    if (
      !interactionMember.permissions.has(PermissionFlagsBits.ManageMessages) &&
      (env.HELPER_ROLE_ID
        ? !interactionMember.roles.cache.has(env.HELPER_ROLE_ID)
        : true)
    ) {
      await replyWithEmbedError(interaction, {
        description:
          'Only helpers or moderators can mark a message as useful',
      })

      return
    }

    if (interaction.targetId === interaction.channelId) {
      await replyWithEmbedError(interaction, {
        description:
          "You can't mark the post itself as useful. If you figured out the issue by yourself, please send it as a separate message and mark it as useful",
      })

      return
    }

    if (interaction.targetMessage.author.id === interaction.user.id) {
      await replyWithEmbedError(interaction, {
        description: "You can't mark your own message as useful",
      })

      return
    }

    await markMessageAsUseful(
      interaction.targetMessage.id,
      interaction.channelId,
    )

    const targetMember = await interaction.guild?.members.fetch(
      interaction.targetMessage.author.id,
    )
    if (targetMember) {
      await tryToSetRegularMemberRole(interactionMember)
    }

    const answeredTagId = mainChannel.availableTags.find((t) =>
      t.name.includes('Answered'),
    )?.id

    if (answeredTagId) {
      const newTags = Array.from(
        new Set([...channel.appliedTags, answeredTagId]),
      )
      await channel.setAppliedTags(newTags)
    }

    await replyWithEmbed(interaction, {
      title: '✅ Success!',
      description:
        'This message has been marked as useful! If you have any other questions, feel free to create another post',
      color: Colors.Green,
      fields: [
        {
          name: 'Jump to Useful',
          value: `[Click here](${interaction.targetMessage.url})`,
          inline: true,
        },
      ],
    })
    await interaction.targetMessage.react('✅')

    // edit instructions message to add the button for message url (get the first message sent by the bot)
    const instructionsMessage = (
      await channel.messages.fetch({
        cache: true,
        after: channel.id,
      })
    )
      .filter((m) => m.author.id === interaction.client.user?.id)
      .last()

    if (instructionsMessage) {
      try {
        instructionsMessage.edit({
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Link,
                  label: 'Jump to Useful',
                  url: interaction.targetMessage.url,
                },
              ],
            },
          ],
        })
      } catch (err) {
        console.error('Failed to update instructions message:', err)
      }
    }
  },
}
