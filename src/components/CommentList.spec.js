import React from 'react'
import {mount} from 'cypress-react-unit-test'
import CommentsList from './CommentList'
import { createMuiTheme, ThemeProvider } from "@material-ui/core";

describe('CommentsList', () => {
  const comments = [{
    id: 1,
    content: 'Write app code'
  }, {
    id: 2,
    content: 'Test it'
  }]

  it('loads', () => {
    cy.viewport(200, 300)

    mount(<CommentsList comments={comments} />)
  })

  it('loads with theme', () => {
    cy.viewport(200, 300)

    // why don't I see the effect on the list?
    const theme = createMuiTheme({
      palette: {
        primary: {
          light: '#757ce8',
          main: '#3f50b5',
          dark: '#002884',
          contrastText: '#fff',
        },
      },
    });

    mount(
      <ThemeProvider theme={theme}>
        <CommentsList comments={comments} />
      </ThemeProvider>
    )
    cy.get('[data-test=comments-list] li').should('have.length', 2)
  })
})
