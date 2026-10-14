/*
  Types for Schedule / Events API.
  Mirrors the backend DTOs.
*/

export enum EventType {
  TEST = 'TEST',
  ACTIVITY = 'ACTIVITY',
  CLASSROOM = 'CLASSROOM',
  MEETING = 'MEETING',
  STUDY_SESSION = 'STUDY_SESSION',
  PERSONAL = 'PERSONAL',
}

/** Input for creating a new reminder / event */
export interface NewReminderInput {
  title: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  urgent: boolean;
  /** Optional enum to specify the event type */
  type?: EventType;
}

/** Input for updating an existing event */
export type EventPutRequestDto = {
  title?: string;
  description?: string;
  startTime?: string; // ISO
  endTime?: string;   // ISO
  type?: EventType;
  reminderOffset?: number;
};

export type EventPostRequestDto = {
  title: string;
  description?: string;
  startTime: string; // ISO date
  endTime?: string;
  type?: EventType;
  courseId?: number;
  reminderOffset?: number;
};

export type Events = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: EventType;
  reminderOffset?: number;
  // other fields omitted for brevity
};

export type ScheduleGetRequestDto = Events; // alias for list endpoint

export type EventStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type UserEvents = {
  id: number;
  eventId: number;
  status: EventStatus;
  reminderOffset?: number;
  completed?: boolean;
};
