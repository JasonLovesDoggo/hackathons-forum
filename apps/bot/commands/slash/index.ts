import * as refreshAnswerCount from './refresh-answer-count.js'
import * as refreshLastActive from './refresh-last-active.js'
import * as lockLowEffortPost from './lock-low-effort-post.js'
import * as addRegularMemberRole from './add-regular-member-role.js'
import * as revokeRegularMemberRole from './revoke-regular-member-role.js'
import * as getUsefulCount from './get-useful-count.js'


export const slashCommands = [
  refreshAnswerCount.command,
  refreshLastActive.command,
  lockLowEffortPost.command,
  addRegularMemberRole.command,
  revokeRegularMemberRole.command,
\  getUsefulCount.command,
]
