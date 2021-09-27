import { Operation } from '../operation';
import { Labels } from '../labels';
import { Future } from '../future';
import { withLabels } from '../labels';


/**
 * Apply the given labels to the current task. This can be used to dynamically
 * set labels, for example as the state of the operation changes, or as more
 * information becomes available.
 *
 * If possible you should prefer to set labels statically using {@link withLabels},
 * or by passing them as options to {@link run} or {@link spawn}.
 *
 * Existing labels are not removed, but may be overwritten if the key is the
 * same.
 *
 * ### Example
 *
 * ```typescript
 * import { main, label } from 'effection';
 *
 * function createSocket(url) {
 *   // use `withLabels` for information which is known statically
 *   return withLabels(function*() {
 *     let socket = new WebSocket(url);
 *     yield once(socket, 'open');
 *
 *     // state has changed dynamically, use `label` to update labels
 *     yield label({ state: 'open'});
 *
 *     let initMessage = yield once(socket, 'message');
 *
 *     // we received a handshake message with some new information
 *     yield label({ state: 'initialized', connectionId: initMessage.data.connectionId });
 *
 *     // ...
 *   }, { labels: { name: 'createSocket', state: 'pending' }});
 * });
 * ```
 *
 * @param labels the labels to apply
 */
export function label(labels: Labels): Operation<void> {
  return withLabels((task) => {
    let { scope } = task.options;
    if(!scope) {
      throw new Error('cannot run `label` on a task without scope');
    }
    scope.setLabels(labels);
    return Future.resolve(undefined);
  }, { name: 'label' });
}
