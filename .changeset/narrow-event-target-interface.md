---
"@effection/events": patch
---

Only require EventTarget-like objects for the `on()` method to
implement the `addEventListener` and `removeEventlistener` functions,
not `dispatchEvent`
