import { SlashCommandBuilder, TextChannel, PermissionFlagsBits } from 'discord.js';
import { SlashCommand } from '../types.js';
import { replyWithEmbedError } from '../../utils.js';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('create_hackathon')
    .setDescription('Create a new hackathon channel')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the hackathon channel')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const namePattern = /^[a-z]{3}-\d{1,2}-[a-z]{3}$/i;

    if (!namePattern.test(name)) {
      await replyWithEmbedError(interaction, {
        description: 'Invalid channel name format. Please use "{short month name}-{day-of-month}-{short acronym for hackathon}".',
      });
      return;
    }

    const channel = await interaction.guild?.channels.create({
      name,
      type: 'GUILD_TEXT',
    });

    if (!channel || !(channel instanceof TextChannel)) {
      await replyWithEmbedError(interaction, {
        description: 'Failed to create the channel. Please try again or contact a staff member.',
      });
      return;
    }

    await interaction.reply({
      content: `Hackathon channel ${channel} created successfully!`,
      ephemeral: true,
    });
  },
};
