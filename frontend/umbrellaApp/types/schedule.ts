export enum EventType {
  TEST = 'TEST',
  ACTIVITY = 'ACTIVITY',
  CLASSROOM = 'CLASSROOM',
  MEETING = 'MEETING',
  STUDY_SESSION = 'STUDY_SESSION',
  PERSONAL = 'PERSONAL',
}

export type EventPutRequestDto = {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  type?: EventType;
  reminderOffset?: number;
};

export type EventPostRequestDto = {
  title: string;
  description?: string;
  startTime: string;
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
};

export type ScheduleGetRequestDto = Events;

export type EventStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type UserEvents = {
  id: number;
  eventId: number;
  status: EventStatus;
  reminderOffset?: number;
  completed?: boolean;
};
