/**
 * BotCraft frontend types (JSDoc shapes; this static SiteCraft page does not
 * require a TypeScript compilation step).
 *
 * @typedef {'assistant' | 'user'} MessageRole
 * @typedef {'sending' | 'sent' | 'failed'} MessageStatus
 * @typedef {{ id: string, label: string, value: string, kind?: 'answer' | 'starter' }} QuickOption
 * @typedef {{ id: string, file: File, name: string, size: number, type: string,
 *   isImage: boolean, url: string, extension: string }} ChatAttachment
 * @typedef {{ value: string, label: string }} FormOption
 * @typedef {{ id: string, question: string, type: string, mandatory: boolean,
 *   options: FormOption[] }} FormQuestion
 * @typedef {{ selected: string[], text: string }} FormAnswerState
 * @typedef {{ id: string, role: MessageRole, text: string, time: Date,
 *   options?: QuickOption[], optionsUsed?: boolean, status?: MessageStatus,
 *   questions?: FormQuestion[], form?: Record<string, FormAnswerState>, formSent?: boolean, formError?: string,
 *   attachments?: ChatAttachment[], error?: string }} ChatMessage
 * @typedef {{ type: 'message' | 'quick-option' | 'attachment' | 'retry',
 *   text?: string, option?: QuickOption, attachments?: ChatAttachment[],
 *   formAnswers?: { id: string, value: string }[],
 *   retryOf?: string }} ChatAction
 */
export {};