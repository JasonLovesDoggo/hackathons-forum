import { randomUUID } from 'crypto'

type RequiredMessageFields = {
  id: string
  snowflakeId: string
  authorId: string
  createdAt: Date
  replyToMessageId: string | null
}

type GroupedMessages<T> = Array<{
  id: string
  messages: T[]
}>

export const groupMessagesByUser = <T extends RequiredMessageFields>(
  messages: T[],
) => {
  return messages.reduce<GroupedMessages<T>>((acc, message) => {
    const lastGroup = acc[acc.length - 1]

    if (!lastGroup) {
      return [{ id: randomUUID(), messages: [message] }]
    }

    const addToNewGroup = () => {
      acc.push({ id: randomUUID(), messages: [message] })
      return acc
    }

    // Break the group if the previous message is from a different user
    const lastMessage = lastGroup.messages.at(-1)
    if (!lastMessage || lastMessage.authorId !== message.authorId) {
      return addToNewGroup()
    }

    const secondsFromLastMessage =
      (message.createdAt.getTime() - lastMessage.createdAt.getTime()) / 1000

    // Break the group if the previous message have a considerable difference of time
    if (secondsFromLastMessage > 60 * 5) {
      return addToNewGroup()
    }

    if (message.replyToMessageId) {
      return addToNewGroup()
    }

    lastGroup.messages.push(message)
    return acc
  }, [])
}
