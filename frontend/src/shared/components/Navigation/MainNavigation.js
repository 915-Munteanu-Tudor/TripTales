import React from "react";
import { Link } from "react-router-dom";
import MainHeader from "./MainHeader";
import "./MainNavigation.css";
import NavLinks from "./NavLinks";
import SideDrawer from "./SideDrawer";
import { useState } from "react";
import Backdrop from "../UIElements/Backdrop";

const MainNavigation = (props) => {
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const openDrawerHandler = () => {
    setDrawerIsOpen(true);
  };

  const closeDraweHandlerr = () => {
    setDrawerIsOpen(false);
  };

  return (
    <React.Fragment>
      {drawerIsOpen && <Backdrop onClick={closeDraweHandlerr} />}
      <SideDrawer show={drawerIsOpen} onClick={closeDraweHandlerr}>
        <nav className="main-navigation__drawer-nav">
          <NavLinks />
        </nav>
      </SideDrawer>
      <MainHeader>
        <div className="menu-title">
          <button
            className="main-navigation__menu-btn"
            onClick={openDrawerHandler}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className="main-navigation__title">
            <Link
              to="/"
              onClick={(event) => {
                if (window.location.pathname === "/") {
                  event.preventDefault();
                  window.location.reload();
                }
              }}
            >
              TripTales
            </Link>
          </h1>
          {/* <nav className="main-navigation__header-nav">
                    <NavLinks />
                </nav> */}
        </div>
      </MainHeader>
    </React.Fragment>
  );
};

export default MainNavigation;
