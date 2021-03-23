---
id: cli-etiquette
title: A well behaved CLI
---

A Command Line Interface (CLI) typically runs several process in parallel that must be bound to the CLI's context. Therefore, if the user decides to close the CLI, all of its associated processes must be terminated. CLI etiquette establishes that a single Control + C should terminate services, and send SIGINT to bleh, _what exactly do we need to do?_

