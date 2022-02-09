import { ReadonlyRecord } from "fp-ts/ReadonlyRecord";
import { Slice } from "../src";

type AA = {
  b: string;
  v: number;
};

type AB = ReadonlyRecord<string, string>;

type A = {
  a: AA;
  b: AB;
};

type ROOT = {
  a: A;
};

declare const atom: Slice<ROOT>;

// $ExpectError
atom.slice('a', 'c');

atom.slice('a', 'b'); // $ExpectType Slice<Readonly<Record<string, string>>>

atom.slice('a'); // $ExpectType Slice<A>

// $ExpectError
atom.slice('a').slice('c');

atom.slice('a').slice('a').slice('b'); // $ExpectType Slice<string>
atom.slice('a').slice('a', 'b'); // $ExpectType Slice<string>

interface Deep {
  a: {
    b: {
      c: {
        d: {
          e: {
            f: {
              g:{
                h: {
                  i: {
                    j: {
                      k: {
                        l: {
                          m: {
                            n: {
                              o: {
                                p: {
                                  q: {
                                    r: {
                                      s: {
                                        t: {
                                          u: 'u bet'
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

declare const deep: Slice<Deep>;

deep.slice('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u'); // $ExpectType Slice<string>

// $ExpectError
deep.slice('a', 'b', 'c', 'd', 'f');
