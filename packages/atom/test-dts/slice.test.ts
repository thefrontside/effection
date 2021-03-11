import { Slice } from "../src";

type AA = {
  b: string;
  v: number;
};

type AB = Readonly<Record<string, string>>;

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
