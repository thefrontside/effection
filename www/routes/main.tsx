import type { Operation } from "effection";

export function* main(): Operation<JSX.Element> {
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
        <h1>Hello World!</h1>
      </body>
    </html>
  );
}
