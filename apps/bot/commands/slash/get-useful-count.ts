import { SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../types.js'
import { getUsefulMessagesCount } from '../../db/actions/users.js'

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('get-useful-count')
    .setDescription('Get the number of your useful messages')
    .addUserOption((user) =>
      user
        .setName('user')
        .setDescription('The user to get number of marked useful messages for')
        .setRequired(false),
    )
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })
    // Get the user option
    const userOption = interaction.options.getUser('user')

    // Use the ID of the user option if it's provided, otherwise use the ID of the interaction user
    const userId = userOption?.id || interaction.user.id
    const userArgProvided = !!userOption
    const count = await getUsefulMessagesCount(userId)

    // Also executes if count is 0
    if (!count) {
      await interaction.editReply({
        content: `It looks like ${
          userArgProvided
            ? 'this user is new to the forum!'
            : "you are new to the forum. Start by marking some messages as useful and you'll see your progress here!"
        }`,
      })
      return
    }

    const guildMember = await interaction.guild?.members.fetch(userId)

    if (!guildMember) {
      await interaction.editReply({
        content: `The user is not in this server.`,
      })
      return
    }

    await interaction.editReply({
      content: `${
        userArgProvided ? `${guildMember.user.username} has` : 'You have'
      } ${count.usefulMessagesCount} useful ${
        count.usefulMessagesCount === 1 ? 'message' : 'messages'
      }!`,
    })
  },
}
