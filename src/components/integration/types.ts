// Message contract for the embedded external integration
export type Periodo = "daily" | "weekly" | "monthly";

export type HostContext = {
  userId: string | null;
  instituteId: string | null;
  period: Periodo;
  range: { start: string; end: string };
};

export type RequestEntriesPayload = {
  period?: Periodo;
  start?: string;
  end?: string;
};

export type CreateEntryPayload = {
  amount: number;
  description?: string | null;
  entry_date?: string; // yyyy-MM-dd
  period?: Periodo;
};

export type UpdateEntryPayload = {
  id: string;
  amount?: number;
  description?: string | null;
};

export type DeleteEntryPayload = { id: string };

export const MSG = {
  EXT_INIT: "EXT_INIT",
  HOST_READY: "HOST_READY",
  REQUEST_CONTEXT: "REQUEST_CONTEXT",
  CONTEXT_DATA: "CONTEXT_DATA",
  REQUEST_ENTRIES: "REQUEST_ENTRIES",
  ENTRIES_DATA: "ENTRIES_DATA",
  CREATE_ENTRY: "CREATE_ENTRY",
  ENTRY_CREATED: "ENTRY_CREATED",
  UPDATE_ENTRY: "UPDATE_ENTRY",
  ENTRY_UPDATED: "ENTRY_UPDATED",
  DELETE_ENTRY: "DELETE_ENTRY",
  ENTRY_DELETED: "ENTRY_DELETED",
  ERROR: "ERROR",
} as const;

export type MessageType = typeof MSG[keyof typeof MSG];

export type ExtMessage = {
  type: MessageType;
  payload?: any;
};
