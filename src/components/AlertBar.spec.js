import React from 'react'
import {mount} from 'cypress-react-unit-test'
import { useMachine } from "@xstate/react";
import AlertBar from './AlertBar'
import { snackbarMachine } from "../machines/snackbarMachine";

describe('AlertBar', () => {
  it.skip('loads with dummy mock', () => {
    cy.viewport(400, 100)
    const snackbarState = {
      changed: true,
      matches (state) {
        return state === 'visible'
      },
      context: {
        severity: 'info',
        message: 'Hi pay-app from from cypress-react-unit-test!'
      }
    }
    const snackbarService = {
      subscribe (cb) {
        return cb(snackbarState)
      }
    }
    mount(<AlertBar snackbarService={snackbarService} />)
  })

  it('loads with xstate machine', () => {
    cy.viewport(400, 100)

    const TestAlertBar = () => {
      const [, send, snackbarService] = useMachine(snackbarMachine)
      send('SHOW', {severity: 'info', message: 'Hello from XState!'})
      return <AlertBar snackbarService={snackbarService} />
    }
    mount(<TestAlertBar />)
    cy.contains('Hello from XState!').should('be.visible')
  })
})
