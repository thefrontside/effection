// /* global describe, beforeEach, it */
// import expect from 'expect';

// describe('generators', () => {
//   let args;
//   let inside;
//   let result;;

//   function* inner() {
//     yield;
//   }
//   function* stuff(...a) {
//     args = a;
//     inside = inner();
//     try {
//       yield* inside;
//     } finally {
//       console.log('finally block');
//     }
//     console.log('reached here');
//   }

//   describe('invoking it with arguments', () => {
//     let gen;
//     beforeEach(() => {
//       gen = stuff(1, 2, 3);
//     });
//     it('does not actually runn anything until you call next()', () => {
//       expect(args).toBeUndefined();
//     });

//     describe('then callirng the next() function', () => {
//       beforeEach(() => {
//         gen.next();
//       });

//       it('begins execution', () => {
//         expect(args).toEqual([1,2,3]);
//       });
//     });

//     describe('then throwing into the yield', () => {
//       let error;
//       beforeEach(() => {
//         try {
//           gen.next();
//           inside.throw('synthetic error');
//           // inside.next();
//         } catch (e) { error = e; }
//       });

//       it('does not throw until you hit the next', () => {
//         expect(error).toBeUndefined();
//       });

//       it('throws the exception once you hit next()', () => {
//         console.log("gen.next() = ", gen.next());
//         console.log("result = ", result);
//       });
//     });

//   });

// });
