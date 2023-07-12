import { Injectable } from '@nestjs/common'
import * as Emittery from 'emittery'

export type InterceptionResult = {
    cancel: boolean
}

export type EventName = PropertyKey
export type DatalessEventNames<EventData> = {
    [Key in keyof EventData]: EventData[Key] extends undefined ? Key : never
}[keyof EventData]

enum ListenerState {
    Queued,
    Idle,
}

@Injectable()
export class InterceptableEmittery<
    EventData = Record<EventName, unknown>,
> extends Emittery<EventData> {
    private onBeforeMap = new Map<
        keyof EventData,
        Set<
            (
                eventData: EventData[keyof EventData],
            ) =>
                | void
                | Promise<void>
                | InterceptionResult
                | Promise<InterceptionResult>
        >
    >()
    private onAfterMap = new Map<
        keyof EventData,
        Set<(eventData: EventData[keyof EventData]) => void | Promise<void>>
    >()
    private listernerStates = new Map<keyof EventData, ListenerState>()
    private eventWaitHandles = new Map<keyof EventData, (() => void)[]>()

    constructor() {
        super()
    }

    override async emit<Name extends DatalessEventNames<EventData>>(
        eventName: Name,
    ): Promise<void>
    override async emit<Name extends keyof EventData>(
        eventName: Name,
        eventData: EventData[Name],
    ): Promise<void>
    override async emit(
        eventName: unknown,
        eventData?: unknown,
    ): Promise<void> {
        const name = eventName as keyof EventData
        const typedEvent = eventData as EventData[keyof EventData]

        this.listernerStates.set(name, ListenerState.Queued)

        const onBefore = this.onBeforeMap.get(name)
        if (onBefore) {
            const onBeforeListeners = [...onBefore]
            const results = await Promise.all(
                onBeforeListeners.map((listener) => listener(typedEvent)),
            )
            if (results.some((result) => result && result.cancel)) {
                return
            }
        }

        await super.emit(name, typedEvent)

        this.listernerStates.set(name, ListenerState.Idle)
        const waitHandles = this.eventWaitHandles.get(name)
        if (waitHandles) {
            waitHandles.forEach((handle) => handle())
        }

        const onAfter = this.onAfterMap.get(name)
        if (onAfter) {
            const onAfterListeners = [...onAfter]
            await Promise.all(
                onAfterListeners.map((listener) => listener(typedEvent)),
            )
        }
    }

    onBefore<Name extends keyof EventData>(
        eventName: Name,
        listener: (
            eventData: EventData[Name],
        ) =>
            | void
            | Promise<void>
            | InterceptionResult
            | Promise<InterceptionResult>,
    ): void {
        const listeners = this.onBeforeMap.get(eventName)
        const typedListener = listener as (
            eventData: EventData[keyof EventData],
        ) =>
            | void
            | Promise<void>
            | InterceptionResult
            | Promise<InterceptionResult>
        if (listeners) {
            listeners.add(typedListener)
        } else {
            this.onBeforeMap.set(eventName, new Set([typedListener]))
        }
    }

    onAfter<Name extends keyof EventData>(
        eventName: Name,
        listener: (eventData: EventData[Name]) => void | Promise<void>,
    ): void {
        const listeners = this.onAfterMap.get(eventName)
        const typedListener = listener as (
            eventData: EventData[keyof EventData],
        ) => void | Promise<void>
        if (listeners) {
            listeners.add(typedListener)
        } else {
            this.onAfterMap.set(eventName, new Set([typedListener]))
        }
    }

    waitForLatest<Name extends keyof EventData>(
        eventName: Name,
    ): Promise<void> {
        const state = this.listernerStates.get(eventName)
        if (state === ListenerState.Idle) {
            return Promise.resolve()
        }
        return new Promise((resolve) => {
            const waitHandles = this.eventWaitHandles.get(eventName)
            if (waitHandles) {
                waitHandles.push(resolve)
            } else {
                this.eventWaitHandles.set(eventName, [resolve])
            }
        })
    }
}
