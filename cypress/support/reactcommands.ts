Cypress.Commands.add("reactComponent", { prevSubject: "element" }, ($el) => {
    if ($el.length !== 1) {
      throw new Error(`cy.component() requires element of length 1 but got ${$el.length}`);
    }
    const key = Object.keys($el.get(0)).find((key) => key.startsWith("__reactFiber$"));
  
    // @ts-ignore
    const domFiber = $el.prop(key);
  
    Cypress.log({
      name: "component",
      consoleProps() {
        return {
          component: domFiber,
        };
      },
    });
  
    return domFiber.return;
  });