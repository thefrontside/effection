import type { Operation } from "effection";

import { loadDocs } from "../docs/docs.ts";

export function* main(): Operation<JSX.Element> {
  let topics = yield* loadDocs();

  return (
    <html lang="en-US" dir="ltr">
      <head>
        <meta charset="UTF-8"/>
        <title>Introduction | Effection</title>
        <meta property="og:image" content="/assets/images/meta-effection.png"/>
        <meta property="og:title" content="Introduction | Effection" data-rh="true"/>
        <meta property="og:url" content="https://frontside.com/effection/docs/guides/introduction"/>
        <meta property="og:description" content="Effection is a structured concurrency and effects framework for JavaScript."/>
        <meta name="description" content="Effection is a structured concurrency and effects framework for JavaScript."/>
        <meta name="twitter:image" content="/assets/images/meta-effection.png"/>
        <link rel="icon" href="/assets/images/favicon-effection.png"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="canonical" href="https://frontside.com/effection/docs/guides/introduction"/>
        <link rel="alternate" href="https://frontside.com/effection/docs/guides/introduction" hreflang="en"/>
        <link rel="alternate" href="https://frontside.com/effection/docs/guides/introduction" hreflang="x-default"/>
      </head>
      <body>
        <nav>
          <ul class="flex justify-between">
            <li class="mr-6">
              <a class="text-blue-500 hover:text-blue-800" href="/guides">Guides</a>
            </li>
            <li>
              <a class="text-blue-500 hover:text-blue-800" href="/api">API Reference</a>
            </li>
            <li><a class="text-blue-500 hover:text-blue-800" href="/">Guides</a></li>
            <li><a class="text-blue-500 hover:text-blue-800" href="/discord">Discord</a></li>
          </ul>
        </nav>
        <section role="sidebar">
          {topics.map(topic => (
            <menu>
              <li>
                <b>{topic.name}</b>
                <ul>
                  {topic.items.map(doc => <li>{doc.title}</li>)}
                </ul>
              </li>
            </menu>
          ))}
        </section>
      </body>
    </html>
  );
}