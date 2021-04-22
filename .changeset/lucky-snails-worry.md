---
"@effection/node": patch
---
Disable command parsing when exec({ shell: true }). This allows complex commands that involve pipes and redirects to work
