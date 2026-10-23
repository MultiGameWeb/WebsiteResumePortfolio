/**
 * BotCraft frontend types (JSDoc shapes; this static SiteCraft page does not
 * require a TypeScript compilation step).
 *
 * @typedef {'assistant' | 'user'} MessageRole
 * @typedef {'sending' | 'sent' | 'failed'} MessageStatus
 * @typedef {{ id: string, label: string, value: string, kind?: 'answer' | 'starter' }} QuickOption
 * @typedef {{ id: string, file: File, name: string, size: number, type: string,
 *   isImage: boolean, url: string, extension: string }} ChatAttachment
 * @typedef {{ id: string, role: MessageRole, text: string, time: Date,
 *   options?: QuickOption[], optionsUsed?: boolean, status?: MessageStatus,
 *   attachments?: ChatAttachment[], error?: string }} ChatMessage
 * @typedef {{ type: 'message' | 'quick-option' | 'attachment' | 'retry',
 *   text?: string, option?: QuickOption, attachments?: ChatAttachment[],
 *   retryOf?: string }} ChatAction
 */
export {};