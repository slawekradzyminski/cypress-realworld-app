
import { pick } from "lodash/fp";


Cypress.Commands.add("createTransaction", (payload) => {
    const log = Cypress.log({
      name: "createTransaction",
      displayName: "CREATE TRANSACTION",
      message: [`💸 (${payload.transactionType}): ${payload.sender.id} <> ${payload.receiver.id}`],
      // @ts-ignore
      autoEnd: false,
      consoleProps() {
        return payload;
      },
    });
  
    return cy
      .window({ log: false })
      .then((win) => {
        log.snapshot("before");
        win.createTransactionService.send("SET_USERS", payload);
  
        const createPayload = pick(["amount", "description", "transactionType"], payload);
  
        return win.createTransactionService.send("CREATE", {
          ...createPayload,
          senderId: payload.sender.id,
          receiverId: payload.receiver.id,
        });
      })
      .then(() => {
        log.snapshot("after");
        log.end();
      });
  });