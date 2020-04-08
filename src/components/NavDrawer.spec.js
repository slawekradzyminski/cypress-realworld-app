import React from 'react'
import { Router } from "react-router-dom";
import {mount} from 'cypress-react-unit-test'
import NavDrawer from './NavDrawer'

describe('NavDrawer', () => {
  it.skip('loads', () => {
    const toggleDesktopDrawer = cy.stub()
    const desktopDrawerOpen = false
    const closeMobileDrawer = cy.stub()
    const authService = {}
    const history = {
      listen: cy.stub()
    }

    mount(
      <Router history={history}>
        <NavDrawer
          toggleDrawer={toggleDesktopDrawer}
          drawerOpen={desktopDrawerOpen}
          closeMobileDrawer={closeMobileDrawer}
          authService={authService}
        />
      </Router>
    )
  })
})
