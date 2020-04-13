import React from 'react'
import { mount } from 'cypress-react-unit-test'
import NotificationList from './NotificationList'
import { createMuiTheme, ThemeProvider } from "@material-ui/core";

const notifications = [{
  id: 1,
  likeId: 0,
  content: 'Write app code',
  userFullName: 'Amir'
}, {
  id: 2,
  likeId: 1,
  content: 'Test it',
  userFullName: 'Jessica'
}]

describe('NotificationList', () => {
  beforeEach(() => {
    cy.viewport(600, 600)
  })

  describe('with notifications', () => {
    let updateNotificationSpy
    beforeEach(() => {
      updateNotificationSpy = cy.spy()
      mount(<NotificationList notifications={notifications} />)
    })

    it('loads', () => {
      cy.get('[data-test=notifications-list] > *')
        .should('have.length', notifications.length)

      cy.get('[data-test=zero-notifications-image]').should('not.exist')
    })

    it('passes the updateNotification method down', () => {
      cy.viewport(600, 600)

      const updateNotificationSpy = cy.spy()
      mount(<NotificationList
        notifications={notifications}
        updateNotification={updateNotificationSpy} />)

      cy.get('[data-test=notification-mark-read-1]')
        .click()
        .then(() => expect(updateNotificationSpy).to.be.calledOnce)
    })
  })

  describe('with custom theme provider', () => {
    it('loads with theme', () => {
      const theme = createMuiTheme({
        palette: {
          primary: {
            light: '#757ce8',
            main: '#f00',
            dark: '#002884',
            contrastText: '#fff',
          },
        },
      });

      mount(
        <ThemeProvider theme={theme}>
          <NotificationList notifications={notifications} />
        </ThemeProvider>
      )
      cy.get('[data-test=notification-mark-read-1]')
        .should('have.class', 'MuiButton-textPrimary')
    })
  })

  describe('without notifications', () => {
    it('shows a placeholder image', () => {
      mount(<NotificationList notifications={[]} />)
      cy.get('[data-test=zero-notifications-image]').should('exist')
    })
  })
})
