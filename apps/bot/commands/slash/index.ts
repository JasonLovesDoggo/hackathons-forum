// import * as refreshAnswerCount from './refresh-answer-count.js'
import * as refreshLastActive from './refresh-last-active.js'
// import * as removePostAnswer from './remove-post-answer.js'
import * as addRegularMemberRole from './add-regular-member-role.js'
import * as revokeRegularMemberRole from './revoke-regular-member-role.js'
// import * as getAnswerCount from './get-answer-count.js'

export const slashCommands = [
  // refreshAnswerCount.command,
  refreshLastActive.command,
  // removePostAnswer.command,
  addRegularMemberRole.command,
  revokeRegularMemberRole.command,
  // getAnswerCount.command,
]
