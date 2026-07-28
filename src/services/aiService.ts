import { BASE_URL } from '../config/env';
import { getTokens } from './storageService';

export interface StreamEvent {
  event: 'start' | 'token' | 'done' | 'escalate' | 'error';
  data: any;
}

/**
 * Streams AI response using XMLHttpRequest + Server Sent Events (SSE)
 * @param message - user message
 * @param conversationId - optional conversation ID
 * @param signal - AbortSignal to cancel the request
 */
export const streamMessageToAI = async (
  message: string,
  conversationId: number | null,
  signal?: AbortSignal
): Promise<AsyncGenerator<StreamEvent>> => {
  const tokens = await getTokens();
  const accessToken = tokens?.access || '';

  const url = `${BASE_URL}ai/chat/`;

  return {
    async *[Symbol.asyncIterator]() {
      const xhr = new XMLHttpRequest();

      let buffer = '';
      let processedLength = 0;

      let done = false;
      let error: Error | null = null;

      const queue: StreamEvent[] = [];

      let waitingResolve:
        | ((value: IteratorResult<StreamEvent>) => void)
        | null = null;
      let waitingReject: ((reason?: any) => void) | null = null;

      /**
       * Push event to queue or directly resolve waiting iterator
       */
      const pushEvent = (event: StreamEvent) => {
        if (waitingResolve) {
          const resolve = waitingResolve;
          waitingResolve = null;
          waitingReject = null;
          resolve({
            value: event,
            done: false,
          });
        } else {
          queue.push(event);
        }
      };

      /**
       * Parse complete SSE events
       */
      const processBuffer = () => {
        let separatorIndex;

        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.substring(0, separatorIndex);
          buffer = buffer.substring(separatorIndex + 2);

          const lines = rawEvent.split('\n');

          let eventType = '';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            }

            if (line.startsWith('data:')) {
              data += line.substring(5).trim();
            }
          }

          if (!data) continue;

          try {
            const parsed = JSON.parse(data);

            if (!eventType) {
              eventType = parsed.event;
            }

            pushEvent({
              event: eventType as StreamEvent['event'],
              data: parsed.data,
            });
          } catch (e) {
            console.warn('Failed to parse SSE event:', data);
          }
        }
      };

      xhr.open('POST', url, true);

      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.setRequestHeader(
        'Authorization',
        `Bearer ${accessToken}`
      );

      xhr.onprogress = () => {
        const response = xhr.responseText.substring(processedLength);

        processedLength = xhr.responseText.length;

        buffer += response;

        processBuffer();
      };

      xhr.onload = () => {
        processBuffer();

        done = true;

        if (waitingResolve) {
          waitingResolve({
            value: undefined as any,
            done: true,
          });

          waitingResolve = null;
        }
      };

      xhr.onerror = () => {
        error = new Error(
          `Streaming failed (HTTP ${xhr.status})`
        );

        if (waitingReject) {
          waitingReject(error);
        }
      };

      // --- Abort handling ---
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          // Push an error event so the generator can exit gracefully
          pushEvent({
            event: 'error',
            data: 'Generation stopped by user',
          });
          // Mark as done to break the loop
          done = true;
        });
      }

      xhr.send(
        JSON.stringify({
          message,
          conversation_id: conversationId,
        })
      );

      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
          continue;
        }

        if (done) {
          break;
        }

        if (error) {
          throw error;
        }

        const result = await new Promise<
          IteratorResult<StreamEvent>
        >((resolve, reject) => {
          waitingResolve = resolve;
          waitingReject = reject;
        });

        if (result.done) {
          break;
        }

        yield result.value;
      }
    },
  };
};