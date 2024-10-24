import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { LinkContainer } from 'react-router-bootstrap';
import { routes } from 'shared/routes';


export default function NavbarComp() {

  const navItems = [
    { name: 'Data', route: routes.download, childs:[] },
   
  ]

  
  return (
    <Navbar style={{ backgroundColor: '#85A389' }} className='app-nav'>
      {/* <Navbar style={{ backgroundColor: '#E0218A' }} className='app-nav'> */}
      <div style={{ display: 'flex', marginLeft: '1%' }}>
        <Navbar.Brand href="/home">GBGR</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        {/* <LinkContainer to={routes.download} key={'routes'}>
                          <Nav.Link style={{ color: '#fff' }}>{"Download"}</Nav.Link>
                        </LinkContainer> */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {
              navItems.map((ni, idx) => (
                
                  <LinkContainer to={ni.route} key={idx}>
                    <Nav.Link style={{ color: '#fff' }}>{ni.name}</Nav.Link>
                  </LinkContainer>
              ))
            }
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  )
}
