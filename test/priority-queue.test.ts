import { describe, it } from "node:test";
import { PriorityQueue } from "../lib/priority-queue.ts";
import { expect } from "./suite.ts";

describe("priority queue", () => {
  it("gives priority to lower numbers", () => {
    let q = new PriorityQueue<string>();
    q.push(3, "!");
    q.push(2, "world");
    q.push(1, "hello");

    expect(`${q.pop()} ${q.pop()}${q.pop()}`).toEqual("hello world!");
  });
  it("within a priority cohort, it is FIFO", () => {
    let q = new PriorityQueue<string>();
    q.push(0, "hello");
    q.push(0, "world");
    q.push(0, "!");

    q.push(1, "fire");
    q.push(6, "disco");
    q.push(6, "ballz");

    expect(`${q.pop()} ${q.pop()}${q.pop()}`).toEqual("hello world!");
  });

  it("produces undefined when there is nothing on the queeu", () => {
    let q = new PriorityQueue<string>();
    expect(q.pop()).toBeUndefined();
  });
});
