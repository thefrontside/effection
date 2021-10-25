import { Queue, Subscription, createQueue } from 'effection';

type Close<T> = T extends undefined ? (() => void) : ((result: T) => void);
type CloseKey<K, T> = T extends undefined ? ((key: K) => void) : ((key: K, result: T) => void);

/**
 * A dispatch object which dispatches messages by key. See {@link createDispatch}.
 *
 * @typeparam K the type of the keys
 * @typeparam V the type of the messages
 * @typeparam TClose the type that the dispatch can be closed with
 */
export interface Dispatch<K, V, TClose = undefined> {

  /**
   * Send a message to the dispatch with the given key.
   *
   * @param key the key to send to
   * @param value the message
   */
  send(key: K, value: V): void;

  /**
   * Return a subscription which receives messages for the given key
   *
   * @param key the key to receive messages from
   */
  get(key: K): Subscription<V, TClose>

  /**
   * Close all subscriptions
   */
  close: Close<TClose>

  /**
   * Close the subscription with the given key
   */
  closeKey: CloseKey<K, TClose>
}

/**
 * Create a new dispatch object. Messages sent to the dispatch object get put
 * into separate queues, based on the given key. Calling {@link get} returns a
 * subscription which contains all messages sent to this key.
 *
 * @typeparam K the type of the keys
 * @typeparam V the type of the messages
 * @typeparam TClose the type that the dispatch can be closed with
 */
export function createDispatch<K, V, TClose = undefined>(): Dispatch<K, V, TClose> {
  let map = new Map<K, Queue<V, TClose>>();

  function getQueue(key: K): Queue<V, TClose> {
    let queue = map.get(key);
    if(queue) {
      return queue;
    } else {
      queue = createQueue();
      map.set(key, queue);
      return queue;
    }
  }

  return {
    send(key: K, value: V) {
      getQueue(key).send(value);
    },

    get(key: K) {
      return getQueue(key).subscription;
    },

    close: ((result) => {
      for(let [, value] of map) {
        value.closeWith(result);
      }
      map.clear();
    }) as Close<TClose>,

    closeKey: ((key, result) => {
      let queue = map.get(key);
      if(queue) {
        queue.closeWith(result);
        map.delete(key);
      }
    }) as CloseKey<K, TClose>
  };
}
