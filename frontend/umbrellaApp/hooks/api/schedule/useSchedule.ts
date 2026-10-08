import { useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import type {
  EventPostRequestDto,
  EventPutRequestDto,
  ScheduleGetRequestDto,
  Events,
  UserEvents,
  EventStatus,
} from '@/types/schedule';


export function useSchedule() {
  const { post, get, put, patch, del } = useUmbrellaApi();
  const { userId: authUserId } = useAuthContext();


  const createEvent = useCallback(
    async (dto: EventPostRequestDto) => {

      const response = await post<Events>('schedule', dto);
      return response;
    },
    [post]
  );


  const getAllEvents = useCallback(async (): Promise<ScheduleGetRequestDto[]> => {
    const data = await get<ScheduleGetRequestDto[]>('schedule');
    return Array.isArray(data) ? data : [];
  }, [get]);


  const personalizeEvent = useCallback(
    async (
      eventId: number | string,
      status?: EventStatus,
      reminderOffset?: number
    ): Promise<UserEvents> => {
      const payload: {
        status?: EventStatus;
        reminderOffset?: number;
      } = {};
      if (status !== undefined) payload.status = status;
      if (reminderOffset !== undefined) payload.reminderOffset = reminderOffset;

      const response = await patch<UserEvents>(`schedule/${eventId}/personalize`, payload);
      return response;
    },
    [patch]
  );


  const deleteEvent = useCallback(
    async (eventId: number | string) => {
      await del<void>(`schedule/${eventId}`);
    },
    [del]
  );

  const updateEvent = useCallback(
    async (eventId: number | string, dto: EventPutRequestDto) => {
      const response = await put<Events>(`schedule/${eventId}`, dto);
      return response;
    },
    [put]
  );

  return {
    createEvent,
    getAllEvents,
    personalizeEvent,
    deleteEvent,
    updateEvent,
  };
}
