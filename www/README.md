## Effection Website

The Effection website contains Guides and API documentation. 

### Contributing

#### Using VSCode

The local development workflow with VSCode was adapted to workaround a [bug in Deno VSCode plugin][vscode-bug]. 
To get all of the VSCode niceties, you have to open the `www/www.code-workspace` using _File -> Open Workspace From File_.

### Development

```shellsession
$ deno task dev
```

[vscode-bug]: https://github.com/thefrontside/effection/issues/893
