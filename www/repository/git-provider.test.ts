import { describe, beforeEach, it } from "../testing.ts";
import { useProcess } from "../context/process.ts";
import { createTempDir, type TempDir } from "../testing/temp-dir.ts";
import { join } from "@std/path";
import { Operation } from "effection";
import { capture, ensureDir, writeTextFile, getGitHistory } from "../testing/helpers.ts";
import { expect } from "expect";
import { lookupTagCommit } from "./git-provider.ts";

function* initGitRepo(repoDir: string): Operation<void> {
  yield* yield* useProcess(`git init`, { cwd: repoDir });
  yield* yield* useProcess(`git config user.email "test@example.com"`, { cwd: repoDir });
  yield* yield* useProcess(`git config user.name "Test User"`, { cwd: repoDir });
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

    // initialize git in both directories
    yield* initGitRepo(externalDir);
    yield* initGitRepo(workspaceDir);

    // in external: create 3 commits
    // First commit
    yield* writeTextFile(join(externalDir, "file1.txt"), "first");
    yield* yield* useProcess(`git add file1.txt`, { cwd: externalDir });
    yield* yield* useProcess(`git commit -m "First commit"`, { cwd: externalDir });

    // Second commit
    yield* writeTextFile(join(externalDir, "file2.txt"), "second");
    yield* yield* useProcess(`git add file2.txt`, { cwd: externalDir });
    yield* yield* useProcess(`git commit -m "Second commit"`, { cwd: externalDir });

    // Third commit
    yield* writeTextFile(join(externalDir, 'file3.txt'), "third");
    yield* yield* useProcess(`git add file3.txt`, { cwd: externalDir });
    yield* yield* useProcess(`git commit -m "Third commit"`, { cwd: externalDir });

    // create a tag off 2nd commit (HEAD~1)
    yield* yield* useProcess(`git tag -a v1.0.0 HEAD~1 -m "version 1.0.0"`, { cwd: externalDir });

    // in workspace: add external as remote
    yield* yield* useProcess(`git remote add external ${externalDir}`, { cwd: workspaceDir });
    yield* yield* useProcess(`git fetch external --tags`, { cwd: workspaceDir });    
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
    expect(showProcess.stdout.trim()).toBe("second");
  });
})