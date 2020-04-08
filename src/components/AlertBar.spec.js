import React from 'react'
import {mount} from 'cypress-react-unit-test'
import { useMachine } from "@xstate/react";
import AlertBar from './AlertBar'
import { snackbarMachine } from "../machines/snackbarMachine";

describe('AlertBar', () => {
  it('loads', () => {
    cy.viewport(400, 100)
    // const snackbarState = {
    //   changed: true,
    //   matches (state) {
    //     return state === 'visible'
    //   },
    //   context: {
    //     severity: 'info',
    //     message: 'Hi pay-app from from cypress-react-unit-test!'
    //   }
    // }
    // const snackbarService = {
    //   subscribe (cb) {
    //     return cb(snackbarState)
    //   }
    // }
    // const [, , snackbarService] = useMachine(snackbarMachine)
    // mount(<AlertBar snackbarService={snackbarService} />)
  })
})
