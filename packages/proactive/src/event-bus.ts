import { EventEmitter } from 'node:events';
import type { ProactiveEvent } from '@synapse/shared';

export type EventHandler = (event: ProactiveEvent) => void | Promise<void>;

export class EventBus {
  private emitter = new EventEmitter();
  private readonly ANY_EVENT = '__any__';

  on(eventName: string, handler: EventHandler): void {
    this.emitter.on(eventName, handler);
  }

  off(eventName: string, handler: EventHandler): void {
    this.emitter.off(eventName, handler);
  }

  emit(eventName: string, source: string, payload: Record<string, unknown>): ProactiveEvent {
    const event: ProactiveEvent = {
      id: crypto.randomUUID(),
      name: eventName,
      source,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.emitter.emit(eventName, event);
    this.emitter.emit(this.ANY_EVENT, event);
    return event;
  }

  onAny(handler: EventHandler): void {
    this.emitter.on(this.ANY_EVENT, handler);
  }

  offAny(handler: EventHandler): void {
    this.emitter.off(this.ANY_EVENT, handler);
  }

  listEventNames(): string[] {
    return this.emitter
      .eventNames()
      .filter((n) => n !== this.ANY_EVENT)
      .map(String);
  }
}
