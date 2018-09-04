// import { expect } from "chai";
import "mocha";

// import { IObserver } from "../interfaces/IObserver";
// import { observePath } from "./path";

describe("Path observing", function () {
  //   describe("#get", function () {
  //     it("should get a value", function () {
  //       const obj: any = { value: 42 };
  //       const obs: IObserver = observePath(obj, "value");
  //       expect(obs.get()).to.be.equal(42);
  //     });

  //     it("should get an array value", function () {
  //       const arr: any[] = ["un", "dos", "tres"]; // un pasito palante, María
  //       const obj: any = { value: arr };
  //       const obs: IObserver = observePath(obj, "value[1]");
  //       expect(obs.get()).to.be.equal("dos");
  //     });

  //     it("should get a deep value", function () {
  //       const obj: any = {
  //         a: {
  //           b: {
  //             c: {
  //               d: 42
  //             }
  //           }
  //         }
  //       };
  //       const obs: IObserver = observePath(obj, "a.b.c.d");
  //       expect(obs.get()).to.be.equal(42);
  //     });

  //     it("should get a mixed deep value", function () {
  //       const obj: any = {
  //         a: [
  //           1,
  //           {
  //             b: [
  //               {
  //                 c: {
  //                   d: [
  //                     42,
  //                     "shish",
  //                     [
  //                       {
  //                         k: [
  //                           "f**k",
  //                           "yeah"
  //                         ]
  //                       }
  //                     ]
  //                   ]
  //                 }
  //               }
  //             ]
  //           }
  //         ]
  //       };
  //       const obs: IObserver = observePath(obj, "a[1].b[0].c.d[2][0].k[1]");
  //       expect(obs.get()).to.be.equal("yeah");
  //     });
  //   });

  //   describe("#set", function () {
  //     it("should set a value", function () {
  //       const obj: any = {};
  //       const obs: IObserver = observePath(obj, "value");
  //       obs.set("fldsmdfr");
  //       expect(obj.value).to.be.equal("fldsmdfr");
  //     });

  //     it("should set an array value", function () {
  //       const arr: any[] = [];
  //       const obj: any = { value: arr };
  //       const obs: IObserver = observePath(obj, "value[10]");
  //       obs.set("cowabunga");
  //       expect(arr[10]).to.be.equal("cowabunga");
  //       expect(arr.length).to.be.equal(11);
  //     });

  //     it("should set a deep value", function () {
  //       const obj: any = {
  //         a: {
  //           b: {
  //             c: {
  //               d: null
  //             }
  //           }
  //         }
  //       };
  //       const obs: IObserver = observePath(obj, "a.b.c.d");
  //       obs.set("avocado");
  //       expect(obj.a.b.c.d).to.be.equal("avocado");
  //     });
  //   });
});
