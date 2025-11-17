import { EventEmitter } from 'events'
import { AgentEvent, EventData } from '@/types/events'

export { AgentEvent } from '@/types/events'

export class EventBus extends EventEmitter {
  private static instance: EventBus

  private constructor() {
    super()
    this.setMaxListeners(100) // Support many concurrent agents
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  emit<E extends AgentEvent>(event: E, data: EventData[E]): boolean {
    console.log(`[EventBus] ${event}`, data)
    return super.emit(event, data)
  }

  on<E extends AgentEvent>(
    event: E,
    listener: (data: EventData[E]) => void
  ): this {
    return super.on(event, listener)
  }

  off<E extends AgentEvent>(
    event: E,
    listener: (data: EventData[E]) => void
  ): this {
    return super.off(event, listener)
  }

  once<E extends AgentEvent>(
    event: E,
    listener: (data: EventData[E]) => void
  ): this {
    return super.once(event, listener)
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance()
