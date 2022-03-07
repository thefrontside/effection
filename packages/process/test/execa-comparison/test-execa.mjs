import { describe, it } from "mocha";
import expect from "expect";

// delete this once we see to test difference
import { execaCommand } from "execa";

describe("execa@6 handles env vars", () => {
  describe("env as option - shell: bash", () => {
    it("echo env", async () => {
      let { stdout } = await execaCommand("echo $EFFECTION_TEST_ENV_VAL", {
        shell: "bash",
        env: { EFFECTION_TEST_ENV_VAL: "boop" },
      });

      expect(stdout).toEqual("boop");
    });

    it("echo curly env", async () => {
      let { stdout } = await execaCommand("echo ${EFFECTION_TEST_ENV_VAL}", {
        shell: "bash",
        env: { EFFECTION_TEST_ENV_VAL: "boop" },
      });

      expect(stdout).toEqual("boop");
    });
  });

  describe("env as option - shell: true", () => {
    it("echo env", async () => {
      let { stdout } = await execaCommand("echo $EFFECTION_TEST_ENV_VAL", {
        shell: true,
        env: { EFFECTION_TEST_ENV_VAL: "boop" },
      });

      expect(stdout).toEqual("boop");
    });

    it("echo curly env", async () => {
      let { stdout } = await execaCommand("echo ${EFFECTION_TEST_ENV_VAL}", {
        shell: true,
        env: { EFFECTION_TEST_ENV_VAL: "boop" },
      });

      expect(stdout).toEqual("boop");
    });
  });

  describe("env as option - shell: false", () => {
    it("echo env", async () => {
      let { stdout } = await execaCommand("echo $EFFECTION_TEST_ENV_VAL", {
        shell: false,
        env: { EFFECTION_TEST_ENV_VAL: "boop" },
      });

      expect(stdout).toEqual("boop");
    });

    it("echo curly env", async () => {
      let { stdout } = await execaCommand("echo ${EFFECTION_TEST_ENV_VAL}", {
        shell: false,
        env: { EFFECTION_TEST_ENV_VAL: "boop" },
      });

      expect(stdout).toEqual("boop");
    });
  });

  describe("env that exists through yarn/npm - shell: bash", () => {
    it("echo env", async () => {
      let { stdout } = await execaCommand("echo $npm_lifecycle_event", {
        shell: "bash",
      });

      expect(stdout).toEqual("test");
    });

    it("echo curly env", async () => {
      let { stdout } = await execaCommand("echo ${npm_lifecycle_event}", {
        shell: "bash",
      });

      expect(stdout).toEqual("test");
    });
  });

  describe("env that exists through yarn/npm - shell: true", () => {
    it("echo env", async () => {
      let { stdout } = await execaCommand("echo $npm_lifecycle_event", {
        shell: true,
      });

      expect(stdout).toEqual("test");
    });

    it("echo curly env", async () => {
      let { stdout } = await execaCommand("echo ${npm_lifecycle_event}", {
        shell: true,
      });

      expect(stdout).toEqual("test");
    });
  });

  describe("env that exists through yarn/npm - shell: false", () => {
    it("echo env", async () => {
      let { stdout } = await execaCommand("echo $npm_lifecycle_event", {
        shell: false,
      });

      expect(stdout).toEqual("test");
    });

    it("echo curly env", async () => {
      let { stdout } = await execaCommand("echo ${npm_lifecycle_event}", {
        shell: false,
      });

      expect(stdout).toEqual("test");
    });
  });
});
