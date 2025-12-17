// strict null check が効いている
const x: string = null;
// noImplicitAny が効いている
function f(x) { return x; }
// strictPropertyInitialization が効いている
class A {
  name: string;
}

