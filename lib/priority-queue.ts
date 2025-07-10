export class PriorityQueue<T> {
  public tiers: Tier<T>[] = [];
  public heap: Tier<T>[] = [];

  push(priority: number, item: T) {
    let tier = this.tiers[priority];
    if (tier) {
      tier.items.unshift(item);
    } else {
      let tier = new Tier(priority, [item]);
      this.tiers[priority] = tier;
      let current = this.heap.length;
      this.heap.push(tier);
      while (current > 0) {
        let p = parentOf(current);
        if (priority < this.heap[p].priority) {
          this.heap[current] = this.heap[p];
          this.heap[p] = tier;
        }
        current = p;
      }
    }
  }

  pop(): T | undefined {
    let top = this.heap[0];
    if (!top) {
      return;
    }
    let value = top.items.pop()!;
    if (top.items.length === 0) {
      delete this.tiers[top.priority];
      let tier = this.heap.pop()!;
      if (this.heap.length > 0) {
        let current = 0;
        this.heap[0] = tier;
        while (current < this.heap.length - 1) {
          let left_i = leftOf(current);
          let right_i = rightOf(current);
          let left = this.heap[left_i];
          let right = this.heap[right_i];

          if (left) {
            if (right) {
              if (
                (tier.priority > left.priority) ||
                (tier.priority > right.priority)
              ) {
                if (left.priority < right.priority) {
                  this.heap[current] = left;
                  this.heap[left_i] = tier;
                  current = left_i;
                } else {
                  this.heap[current] = right;
                  this.heap[right_i] = tier;
                  current = right_i;
                }
              } else {
                break;
              }
            } else if (left.priority < tier.priority) {
              this.heap[current] = left;
              this.heap[left_i] = tier;
              current = left_i;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    }
    return value;
  }
}

class Tier<T> {
  constructor(public priority: number, public items: T[]) {}
}

function parentOf(index: number): number {
  return Math.floor((index - 1) / 2);
}
function leftOf(index: number) {
  return index * 2 + 1;
}

function rightOf(index: number) {
  return index * 2 + 2;
}
