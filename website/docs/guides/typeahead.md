---
id: typeahead
title: Type-Ahead
---

Type-ahead (or autocomplete) is a seemingly simple but actually intricate use case of concurrency. The basic idea is that you want to provide suggestions to the user based on what they've typed.

## Challenges

We can make no assumptions about how people type. They may type very fast, or very slow. They may delete a character to fix a typo. They may paste something from the clipboard. They may Select All + delete everything in the input.

A naïve approach would be to call an API every time the user hits a key and bring the results back. However, a person can press many keys before a single API call is resolved. That means lots of wasted resources.

Waiting for the user to stop "typing" may be a solution, but if the user had to complete typing what they intended to write before getting meaningful suggestions, the UX of our typeahead input wouldn't be great. Thus waiting is tricky, and even then we still need

## Approach

_Describe a step by step 'algorithm' to solve this in words not code_

## Quality Criteria

A type-ahead must take into account the following considerations:

- Debouncing: the browser won't make network requests until the user has stopped typing for more than 250ms.
- Fetch cancellation: if the user starts typing while a prior fetch request is underway, that fetch request will be canceled to save network resources.
- User feedback: display both a loading spinner while requests are being made and the final search results.

## Implementations

_We need to figure out how to talk about implementations. In the case of ember-concurrency, I think I can't understand the example without the template; is that the case for other solutions? can we use a common template for all of them or do each solution comes with a template_

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs
  groupId="runner"
  defaultValue="ember-concurrency"
  values={[
    {label: 'ember-concurrency', value: 'ember-concurrency'},
    {label: 'Effection', value: 'effection'}
]}>
  <TabItem value="ember-concurrency">

  ```js
  const DEBOUNCE_MS = 250;
  export default class AutocompleteController extends Controller {
    @restartableTask *searchRepo(term) {
      if (isBlank(term)) { return []; }

      // Pause here for DEBOUNCE_MS milliseconds. Because this
      // task is `restartable`, if the user starts typing again,
      // the current search will be canceled at this point and
      // start over from the beginning. This is the
      // ember-concurrency way of debouncing a task.
      yield timeout(DEBOUNCE_MS);

      let url = `https://api.github.com/search/repositories?q=${term}`;

      // We yield an AJAX request and wait for it to complete. If the task
      // is restarted before this request completes, the XHR request
      // is aborted (open the inspector and see for yourself :)
      let json = yield this.getJSON.perform(url);
      return json.items.slice(0, 10);
    }

    @task *getJSON(url) {
      let controller = new AbortController();
      let signal = controller.signal;

      try {
        let response = yield fetch(url, { signal });
        let result = yield response.json();
        return result;

        // NOTE: could also write this as
        // return yield fetch(url, { signal }).then((response) => response.json());
        //
        // either way, the important thing is to yield before returning
        // so that the `finally` block doesn't run until after the
        // promise resolves (or the task is canceled).
      } finally {
        controller.abort();
      }
    }
  }
  ```

  </TabItem>
  <TabItem value="effection">

  ```js
  ???
  ```

  </TabItem>
</Tabs>
