import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import ErrorModal from "../UIElements/ErrorModal";
import { useHttpClient } from "../../hooks/http-hook";
import Modal from "../UIElements/Modal";
import Button from "../FormElements/Button";
import "./NavLinks.css";

const NavLinks = (props) => {
  const { error, sendRequest, clearError } = useHttpClient();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const cancelConfirmationHandler = () => {
    setShowConfirmation(false);
  };
  const auth = useContext(AuthContext);

  const fetchRecommendations = async (event) => {
    event.stopPropagation();
    auth.setIsLoading(true);
    try {
      const responseData = await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/posts/recommend/${auth.userId}`,
        "POST",
        null,
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );

      if (responseData.message === "Email sent successfully!") {
        setShowConfirmation(true);
      }
    } catch (err) {
      setShowConfirmation(false);
    } finally {
      auth.setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <Modal
        show={showConfirmation}
        onCancel={cancelConfirmationHandler}
        header="Email Sent"
        contentClass="modal-content"
        footerClass="place_item__modal-actions"
        footer={<Button onClick={cancelConfirmationHandler}>CLOSE</Button>}
      >
        <p>An email with your recommendations was sent!</p>
      </Modal>
      <ul className="nav-links">
        <li>
          <NavLink to="/" exact={true}>
            All Users
          </NavLink>
        </li>
        {auth.isLoggedIn && (
          <li>
            <NavLink to={`/${auth.userId}/places`}>My Posts</NavLink>
          </li>
        )}
        {auth.isLoggedIn && (
          <li>
            <NavLink to={`/${auth.userId}/savedposts`}>Saved Posts</NavLink>
          </li>
        )}
        {auth.isLoggedIn && (
          <li>
            <NavLink to="/places/new">Add a Post</NavLink>
          </li>
        )}
        {!auth.isLoggedIn && (
          <li>
            <NavLink to="/auth">Authenticate</NavLink>
          </li>
        )}
        {auth.isLoggedIn && (
          <li>
            <NavLink to={`/${auth.userId}/changepassword`}>
              Change Password
            </NavLink>
          </li>
        )}
        {auth.isLoggedIn && (
          <li>
            <NavLink to={`/${auth.userId}/itinerary`}>Get Itinerary</NavLink>
          </li>
        )}
        {auth.isLoggedIn && (
          <li>
            <button onClick={fetchRecommendations}>Get Recommendations</button>
          </li>
        )}
        {auth.isLoggedIn && (
          <li>
            <button onClick={auth.logout}>Log Out</button>
          </li>
        )}
      </ul>
    </React.Fragment>
  );
};

export default NavLinks;
