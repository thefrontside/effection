import { join } from "@std/path";
import { expect } from "expect";
import { $, $echo, cwd } from "../context/shell.ts";
import { beforeEach, describe, it } from "../testing.ts";
import { ensureDir, getGitHistory } from "../testing/helpers.ts";
import { createTempDir, type TempDir } from "../testing/temp-dir.ts";
import {
  getContent,
  getDefaultBranch,
  lookupTagCommit,
} from "./git-provider.ts";

describe("lookupHeadCommit", () => {
  let tempDir: TempDir;
  let workspaceDir: string;
  let externalDir: string;

  beforeEach(function* () {
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
      // Change default branch to 'develop'
      $(`git checkout -b develop`),
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
      $(`git tag -a v1.0.0 HEAD~1 -m "version 1.0.0"`),
      // Fourth commit
      $echo("fourth", "file4.txt"),
      $(`git add file4.txt`),
      $(`git commit -m "Fourth commit"`),
      // Checkout new branch
      $(`git checkout -b feature-branch`),
      // Fifth commit on feature branch
      $echo("feature", "feature.txt"),
      $(`git add feature.txt`),
      $(`git commit -m "Feature commit"`),
      // Switch back to develop branch (default)
      $(`git checkout develop`),
    ]);
  });

  describe("reading from remote", () => {
    beforeEach(function* () {
      // setup workspace repository with a remote pointing to external
      yield* cwd(workspaceDir, [
        $(`git init`),
        $(`git config user.email "test@example.com"`),
        $(`git config user.name "Test User"`),
        // in workspace: add external as remote
        $(`git remote add external ${externalDir}`),
        $(`git fetch external --tags`),
      ]);
    });

    it("gets commit of tag HEAD from external via remote while in workspace", function* () {
      // Get the commit history with full details from external repo
      const [commits] = yield* cwd(externalDir, [getGitHistory()]);

      // Find the 2nd commit (should have "Second commit" message and v1.0.0 tag)
      const secondCommit = commits[1];
      expect(secondCommit.message).toBe("Second commit");
      expect(secondCommit.tags).toContain("v1.0.0");

      // Test the lookupTagCommit function
      const [commitHash] = yield* cwd(workspaceDir, [lookupTagCommit({
        remoteName: "external",
        tagName: "v1.0.0",
      })]);

      expect(commitHash).toBeDefined();
      expect(commitHash).toMatch(/^[a-f0-9]{40}$/);
      expect(commitHash).toBe(secondCommit.sha);

      // Verify we can get the correct file content (file2.txt was added in 2nd commit)
      const showResult = yield* cwd(workspaceDir, [
        $(`git show ${commitHash}:file2.txt`),
      ]);
      expect(showResult[0].stdout).toEqual("second");
    });

    it("gets default branch via remote", function* () {
      // Get default branch from workspace (should be 'develop')
      const [defaultBranch] = yield* cwd(workspaceDir, [
        getDefaultBranch("external"),
      ]);
      expect(defaultBranch).toEqual("develop");
    });

    describe("getting content via remote", () => {
      it("gets content from tag", function* () {
        // Get content from v1.0.0 tag (points to second commit, should have file2.txt)
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "v1.0.0", "file2.txt"),
        ]);
        expect(content).toEqual("second");
      });

      it("gets content from default branch", function* () {
        // Get content from develop branch (default), should have file4.txt from fourth commit
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "develop", "file4.txt"),
        ]);
        expect(content).toEqual("fourth");
      });

      it("gets content from feature branch", function* () {
        // Get content from feature-branch, should have feature.txt
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "feature-branch", "feature.txt"),
        ]);
        expect(content).toEqual("feature");
      });
    });
  });
});
