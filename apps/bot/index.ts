import { Client, Colors, Events, GatewayIntentBits, Partials } from 'discord.js'
import { dedent } from 'ts-dedent'
import { env } from './env.js'
import { deleteMessage, syncMessage } from './db/actions/messages.js'
import { deletePost, syncPost } from './db/actions/posts.js'
import { baseLog } from './log.js'
import {
  isMessageSupported,
} from './utils.js'
import { contextMenuCommands } from './commands/context/index.js'
import { slashCommands } from './commands/slash/index.js'
import { addPointsToUser, syncUser } from './db/actions/users.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message],
})

client.once(Events.ClientReady, (c) => {
  baseLog(`Ready! Logged in as ${c.user.tag}`)
})

client.on(Events.MessageCreate, async (message) => {
  if (!isMessageSupported(message)) {
    return
  }

  try {
    await syncMessage(message)
    baseLog('Created a new message in channel %s', message.channelId)
  } catch (err) {
    console.error('Failed to create message:', err)
  }
})

client.on(Events.MessageUpdate, async (_, newMessage) => {
  try {
    const message = await newMessage.fetch()
    if (!isMessageSupported(message)) return

    await syncMessage(message)
    baseLog('Updated a message in channel %s', message.channelId)
  } catch (err) {
    console.error('Failed to update message:', err)
  }
})

client.on(Events.MessageDelete, async (message) => {
  try {
    await deleteMessage(message)
    baseLog('Deleted a message in channel %s', message.channelId)
  } catch (err) {
    console.error('Failed to delete message:', err)
  }
})

client.on(Events.ChannelCreate, async (channel) => {
  try {
    await syncPost(channel)
    baseLog('Created a new channel (%s)', channel.id)

    if (channel.ownerId) {
      await addPointsToUser(channel.ownerId, 'question')
    }

    await channel.send({
      embeds: [
        {
          title: 'Hackathon Indexed!',
          description: dedent`
            🔎 This post has been indexed in our web forum and will be seen by search engines so other users can find it outside Discord

            🕵️ Your user profile is public by default and won't be visible to users outside Discord, if you want to be visible in the web forum you can add the "Public Profile" role in <id:customize>

            ✅ You can mark a message as the answer for your post with \`Right click -> Apps -> Mark Solution\`
            (if you don't see the option, try refreshing Discord with Ctrl + R)
          `,
          color: Colors.Blurple,
          image: {
            url: 'https://cdn.discordapp.com/attachments/1043615796787683408/1117191182133501962/image.png',
          },
          url: `${env.WEB_URL}/post/${channel.id}`,
        },
      ],
    })
  } catch (err) {
    console.error('Failed to create channel:', err)
  }
})

client.on(Events.ChannelUpdate, async (_, newChannel) => {
  try {
    await syncPost(newChannel)
    baseLog('Updated a channel (%s)', newChannel.id)
  } catch (err) {
    console.error('Failed to update channel:', err)
  }
})

client.on(Events.ChannelDelete, async (channel) => {
  try {
    await deletePost(channel)
    baseLog('Deleted a channel (%s)', channel.id)
  } catch (err) {
    console.error('Failed to delete channel:', err)
  }
})

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (newMember.user.bot) return
  await syncUser(newMember.user, newMember)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isMessageContextMenuCommand()) {
    contextMenuCommands
      .find((c) => c.data.name === interaction.commandName)
      ?.execute(interaction)
  }

  if (interaction.isChatInputCommand()) {
    slashCommands
      ?.find((c) => c.data.name === interaction.commandName)
      ?.execute(interaction)
  }
})

void client.login(env.DISCORD_BOT_TOKEN)
