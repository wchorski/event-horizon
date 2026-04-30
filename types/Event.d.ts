type EventData = {
  "@odata.context": string;
  "@odata.nextLink"?: string;
  value: CalEvent[];
} | null

type CalEvent = {
  id: string;
  subject: string;
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  isAllDay: boolean
  isCancelled: boolean
  isDraft: boolean
  showAs: "free" | "busy"
  type: "singleInstance" | "occurrence"
};
