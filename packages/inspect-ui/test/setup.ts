import jsdomGlobal from 'jsdom-global';

let dom: () => void;

before(() => {
  dom = jsdomGlobal();

  let rootContainer = document.createElement("div");
  rootContainer.id = 'test';
  document.body.appendChild(rootContainer);
});

after(() => {
  dom();
});
