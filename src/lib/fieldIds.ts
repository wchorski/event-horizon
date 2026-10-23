// lib/fieldIds.ts
export const fieldId = (formId: string, name: string) => `${formId}-field--${name}`;
export const fieldErrorId = (formId: string, name: string) => `${fieldId(formId, name)}-error`;
export const toplevelMsgId = (formId: string) => `${formId}-toplevel-msg`;