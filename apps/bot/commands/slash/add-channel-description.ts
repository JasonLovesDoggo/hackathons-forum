import { SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../types.js'
import { db } from '@hackathons-forum/db/node'
import { env } from '../../env.js'

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('add-channel-description')
    .setDescription('Adds a link to the webview for the channel in the description')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to update the description for')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel')

    if (!channel) {
      await interaction.reply({
        content: 'Channel not found.',
        ephemeral: true,
      })
      return
    }

    const webviewLink = `${env.WEB_URL}/channel/${channel.id}`
    const newDescription = `${channel.topic ?? ''}\n\nWebview: ${webviewLink}`

    await db
      .updateTable('channels')
      .set({ topic: newDescription })
      .where('snowflakeId', '=', channel.id)
      .execute()

    await interaction.reply({
      content: `Channel description updated with the webview link: ${webviewLink}`,
      ephemeral: true,
    })
  },
}
