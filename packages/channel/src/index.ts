export { Channel } from './channel';
export { Subscription } from './subscription';
export { SendChannel, SendChannelSubscription } from './send-channel';
export { MapChannel, MapChannelSubscription, Mapper } from './map-channel';
export { FilterChannel, FilterChannelSubscription, Predicate } from './filter-channel';
export { EventChannel } from './event-channel';

import { SendChannel } from './send-channel';
import { EventChannel } from './event-channel';

import { EventSource } from '@effection/events';

export function createChannel<T>(): SendChannel<T> {
  return new SendChannel();
}

export function createEventChannel(eventSource: EventSource, eventName: string): EventChannel {
  return new EventChannel(eventSource, eventName);
}
