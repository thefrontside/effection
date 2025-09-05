import { join } from "@std/path";
import { expect } from "expect";
import { $, $echo, cwd } from "../context/shell.ts";
import { beforeEach, describe, it } from "../testing.ts";
import { ensureDir, getGitHistory } from "../testing/helpers.ts";
import { createTempDir, type TempDir } from "../testing/temp-dir.ts";
import {
  addRemote,
  checkRemoteExists,
  createGitRepository,
  determineRefType,
  fetchRemote,
  getContent,
  getDefaultBranch,
  getMatchingTags,
  getUncommittedChanges,
  lookupTagCommit,
} from "./git-provider.ts";
import { Repository, RepositoryRef } from "./types.ts";

describe("git-provider", () => {
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
      // create tag off 4th commit with v2
      $(`git tag -a v2.0.0 HEAD -m "version 2.0.0"`),
      // Checkout new branch
      $(`git checkout -b feature-branch`),
      // Fifth commit on feature branch
      $echo("feature", "feature.txt"),
      $(`git add feature.txt`),
      $(`git commit -m "Feature commit"`),
      // Switch back to develop branch (default)
      $(`git checkout develop`),
    ]);

    yield* cwd(workspaceDir, [
      $(`git init`),
      $(`git config user.email "test@example.com"`),
      $(`git config user.name "Test User"`),
    ]);
  });

  describe("fetching remote", () => {
    beforeEach(function* () {
      // Add remote first
      yield* cwd(workspaceDir, [addRemote("external", externalDir)]);
    });

    it("fetches branches", function* () {
      // Fetch from remote
      yield* cwd(workspaceDir, [fetchRemote("external")]);

      // Verify we can now access remote branches
      const [result] = yield* cwd(workspaceDir, [$(`git branch -r`)]);
      expect(result.stdout).toContain("external/develop");
      expect(result.stdout).toContain("external/feature-branch");
    });

    it("fetches tags", function* () {
      // Fetch with tags
      yield* cwd(workspaceDir, [fetchRemote("external", true)]);

      // Verify we can access remote tags
      const [tags] = yield* cwd(workspaceDir, [getMatchingTags("external")]);
      expect(tags).toHaveLength(2);
    });
  });

  describe("adding remote", () => {
    it("adds a new remote successfully", function* () {
      // Add remote to workspace
      yield* cwd(workspaceDir, [addRemote("test-remote", externalDir)]);

      // Verify remote exists
      const [exists] = yield* cwd(workspaceDir, [
        checkRemoteExists("test-remote"),
      ]);
      expect(exists).toBe(true);
    });
  });

  describe("reading from remote", () => {
    beforeEach(function* () {
      // setup workspace repository with a remote pointing to external
      yield* cwd(workspaceDir, [
        // in workspace: add external as remote
        addRemote("external", externalDir),
        fetchRemote("external", true),
      ]);
    });

    describe("check if remote exists", () => {
      it("returns true when exists", function* () {
        const [exists] = yield* cwd(workspaceDir, [
          checkRemoteExists("external"),
        ]);
        expect(exists).toEqual(true);
      });
      it("returns false when doesn't exist", function* () {
        const [exists] = yield* cwd(workspaceDir, [
          checkRemoteExists("not-real"),
        ]);
        expect(exists).toEqual(false);
      });
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

      it("gets content from tag with tags/ prefix", function* () {
        // Get content using tags/ prefix
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "tags/v1.0.0", "file2.txt"),
        ]);
        expect(content).toEqual("second");
      });

      it("gets content from branch with heads/ prefix", function* () {
        // Get content using heads/ prefix
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "heads/develop", "file4.txt"),
        ]);
        expect(content).toEqual("fourth");
      });

      it("gets content from tag with refs/tags/ prefix", function* () {
        // Get content using full refs/tags/ prefix
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "refs/tags/v1.0.0", "file2.txt"),
        ]);
        expect(content).toEqual("second");
      });

      it("gets content from branch with refs/heads/ prefix", function* () {
        // Get content using full refs/heads/ prefix
        const [content] = yield* cwd(workspaceDir, [
          getContent("external", "refs/heads/develop", "file4.txt"),
        ]);
        expect(content).toEqual("fourth");
      });

      it("throws error for non-existent tag with tags/ prefix", function* () {
        expect.assertions(1);
        // Should throw error for non-existent tag
        try {
          yield* cwd(workspaceDir, [
            getContent("external", "tags/non-existent", "file.txt"),
          ]);
          // this shold never happen
          expect(true).toBe(false);
        } catch (error) {
          expect(`${error}`).toContain("Tag non-existent not found");
        }
      });
    });

    describe("finding tags matching patterns", () => {
      it("finds all tags when no pattern specified", function* () {
        const [allTags] = yield* cwd(workspaceDir, [
          getMatchingTags("external"),
        ]);
        expect(allTags).toHaveLength(2);
        expect(allTags.map((t) => t.name)).toContain("v1.0.0");
        expect(allTags.map((t) => t.name)).toContain("v2.0.0");
      });

      it("finds tags matching v1 pattern", function* () {
        const [v1Tags] = yield* cwd(workspaceDir, [
          getMatchingTags("external", "v1*"),
        ]);
        expect(v1Tags).toHaveLength(1);
        expect(v1Tags[0].name).toBe("v1.0.0");
      });

      it("returns empty array for pattern with no matches", function* () {
        const [noMatches] = yield* cwd(workspaceDir, [
          getMatchingTags("external", "v3*"),
        ]);
        expect(noMatches).toHaveLength(0);
      });
    });

    describe("determineRefType", () => {
      it("identifies tags and branches", function* () {
        const results = yield* cwd(workspaceDir, [
          determineRefType("external", "refs/heads/develop"),
          determineRefType("external", "heads/develop"),
          determineRefType("external", "develop"),
          determineRefType("external", "refs/tags/v1.0.0"),
          determineRefType("external", "tags/v1.0.0"),
          determineRefType("external", "v1.0.0"),
        ]);

        expect(results).toMatchObject([
          { type: "branch", name: "develop", normalized: "refs/heads/develop" },
          { type: "branch", name: "develop", normalized: "refs/heads/develop" },
          { type: "branch", name: "develop", normalized: "refs/heads/develop" },
          { type: "tag", name: "v1.0.0", normalized: "refs/tags/v1.0.0" },
          { type: "tag", name: "v1.0.0", normalized: "refs/tags/v1.0.0" },
          { type: "tag", name: "v1.0.0", normalized: "refs/tags/v1.0.0" },
        ]);
      });
    });

    describe("reading uncommitted changes", () => {
      beforeEach(function*() {
        // create a directory first
        yield* ensureDir(join(workspaceDir, "src"));
        
        // checkout feature branch
        yield* cwd(workspaceDir, [
          $(`git checkout feature-branch`),
          // create a new file and stage it but don't commit
          $echo("staged content", "staged-file.txt"),
          $(`git add staged-file.txt`),
          // create a new file in directory but don't stage it
          $echo("unstaged content", "src/unstaged-file.txt"),
          // modify an existing file but don't stage it
          $echo("modified content", "file1.txt"),
        ]);
      });
      
      it("includes staged and unstaged changes", function*() {
        // verify that calling the function returns a list of both staged and unstaged files
        const [changes] = yield* cwd(workspaceDir, [
          getUncommittedChanges(),
        ]);
        
        expect(changes).toContain("staged-file.txt");         // staged new file
        expect(changes).toContain("src/unstaged-file.txt");   // unstaged new file in directory
        expect(changes).toContain("file1.txt");               // modified existing file
        expect(changes).toHaveLength(3);
      });
    })
  });

  describe("createGitRepository", () => {
    let repo: Repository;
    beforeEach(function* () {
      // Create repository instance in workspace context
      const [repository] = yield* cwd(workspaceDir, [
        createGitRepository({
          owner: "external",
          name: "repo",
          repository: externalDir,
        }),
      ]);
      repo = repository;
    });

    it("gets default branch", function* () {
      const [defaultBranch] = yield* cwd(workspaceDir, [
        repo.getDefaultBranch(),
      ]);
      expect(defaultBranch).toBe("develop");
    });

    it("gets tags", function* () {
      const [tags] = yield* cwd(workspaceDir, [repo.tags("v")]);
      expect(tags).toHaveLength(2);
      expect(tags.map((t) => t.name)).toContain("v1.0.0");
      expect(tags.map((t) => t.name)).toContain("v2.0.0");
    });

    it("gets content", function* () {
      const [content] = yield* cwd(workspaceDir, [
        repo.getContent("file4.txt"),
      ]);
      expect(content).toBe("fourth");
    });

    describe("loads ref", () => {
      describe("branch", () => {
        let branchRef: RepositoryRef;

        beforeEach(function* () {
          const [ref] = yield* cwd(workspaceDir, [
            repo.loadRef("heads/develop"),
          ]);
          branchRef = ref;
        });

        it("loads branch", function* () {
          expect(branchRef.type).toBe("branch");
          expect(branchRef.name).toBe("develop");
        });

        it("getContents", function* () {
          const [content] = yield* cwd(workspaceDir, [
            branchRef.getContent("file4.txt"),
          ]);
          expect(content).toBe("fourth");
        });

        it("getUrl", function* () {
          const url = branchRef.getUrl("", "file4.txt", true);
          expect(url.href).toBe(
            "https://github.com/external/repo/blob/develop/file4.txt",
          );
        });
      });

      describe("tags", () => {
        let tagRef: RepositoryRef;

        beforeEach(function* () {
          const [ref] = yield* cwd(workspaceDir, [repo.loadRef("tags/v1.0.0")]);
          tagRef = ref;
        });

        it("loads tags", function* () {
          expect(tagRef.type).toBe("tag");
          expect(tagRef.name).toBe("v1.0.0");
        });

        it("getContents", function* () {
          const [content] = yield* cwd(workspaceDir, [
            tagRef.getContent("file2.txt"),
          ]);
          expect(content).toBe("second");
        });

        it("getUrl", function* () {
          const url = tagRef.getUrl("", "file2.txt", true);
          expect(url.href).toBe(
            "https://github.com/external/repo/blob/v1.0.0/file2.txt",
          );
        });
      });
    });
  });
});
