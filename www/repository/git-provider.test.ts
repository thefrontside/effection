import { describe, beforeEach, it } from "../testing.ts";
import { useProcess } from "../context/process.ts";
import { createTempDir, type TempDir } from "../testing/temp-dir.ts";
import { join } from "@std/path";
import { Operation } from "effection";
import { capture, ensureDir, writeTextFile, getGitHistory, cwd, $, $echo } from "../testing/helpers.ts";
import { expect } from "expect";
import { lookupTagCommit } from "./git-provider.ts";

function* initGitRepo(repoDir: string): Operation<void> {
  yield* cwd(repoDir, [
    $(`git init`),
    $(`git config user.email "test@example.com"`),
    $(`git config user.name "Test User"`)
  ]);
}

describe("lookupHeadCommit", () => {
  let tempDir: TempDir;
  let workspaceDir: string;
  let externalDir: string;

  beforeEach(function*() {
    // create temp directory
    tempDir = yield* createTempDir();
    workspaceDir = join(tempDir.path, "workspace");
    externalDir = join(tempDir.path, "external");

    // create the directories
    yield* ensureDir(workspaceDir);
    yield* ensureDir(externalDir);

    // Setup external respository with 3 commits
    yield* cwd(externalDir, [
      $(`git init`),
      $(`git config user.email "test@example.com"`),
      $(`git config user.name "Test User"`),
      // First commit
      $echo("first", "file1.txt"),
      $(`git add file1.txt`),
      $(`git commit -m "First commit"`),
      // Second commit
      $echo("second", "file2.txt"),
      $(`git add file2.txt`),
      $(`git commit -m "Second commit"`),
      // Third commit
      $echo("third", "file3.txt"),
      $(`git add file3.txt`),
      $(`git commit -m "Third commit"`),
      // create a tag off 2nd commit (HEAD~1)
      $(`git tag -a v1.0.0 HEAD~1 -m "version 1.0.0"`)
    ]);

    // setup workspace repository with a remote pointing to external
    yield* cwd(workspaceDir, [
      $(`git init`),
      $(`git config user.email "test@example.com"`),
      $(`git config user.name "Test User"`),
      // in workspace: add external as remote
      $(`git remote add external ${externalDir}`),
      $(`git fetch external --tags`)
    ])
  });

  it("gets commit of tag HEAD from external via remote while in workspace", function*() {
    // Get the commit history with full details
    const commits = yield* getGitHistory(externalDir);
    
    // Find the 2nd commit (should have "Second commit" message and v1.0.0 tag)
    const secondCommit = commits[1];
    expect(secondCommit.message).toBe("Second commit");
    expect(secondCommit.tags).toContain("v1.0.0");
    
    // Test the lookupTagCommit function
    const commitHash = yield* lookupTagCommit({ 
      remoteName: "external", 
      tagName: "v1.0.0", 
      workingDir: workspaceDir 
    });
    
    expect(commitHash).toBeDefined();
    expect(commitHash).toMatch(/^[a-f0-9]{40}$/);
    expect(commitHash).toBe(secondCommit.sha);
    
    // Verify we can get the correct file content (file2.txt was added in 2nd commit)
    const showProcess = yield* capture(useProcess(`git show ${commitHash}:file2.txt`, { cwd: workspaceDir }));
    expect(showProcess.stdout.trim()).toEqual("second");
  });
})