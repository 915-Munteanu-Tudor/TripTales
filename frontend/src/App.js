import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from "react-router-dom";
import Users from "./user/pages/Users";
import NewPlace from "./places/pages/NewPlace";
import MainNavigation from "./shared/components/Navigation/MainNavigation";
import UserPlaces from "./places/pages/UserPlaces";
import SavedPosts from "./places/pages/SavedPosts";
import GetItinerary from "./places/pages/GetItinerary";
import UpdatePlace from "./places/pages/UpdatePlace";
import Auth from "./user/pages/Auth";
import LoadingSpinner from "./shared/components/UIElements/LoadingSpinner";
import ChangePassword from "./user/pages/ChangePassword";
import { AuthContext } from "./shared/context/auth-context";
import { useAuth } from "./shared/hooks/auth-hook";

const App = () => {
  const { token, login, logout, userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false); // Add loading state here

  let routes;

  useEffect(() => {
    if (isLoading) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [isLoading]);

  if (token) {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Users />
        </Route>
        <Route path="/:userId/places" exact>
          <UserPlaces />
        </Route>
        <Route path="/:userId/changepassword" exact>
          <ChangePassword />
        </Route>
        <Route path="/:userId/savedposts" exact>
          <SavedPosts />
        </Route>
        <Route path="/:userId/itinerary" exact>
          <GetItinerary />
        </Route>
        <Route path="/places/new" exact={true}>
          <NewPlace />
        </Route>
        <Route path="/places/:postId">
          <UpdatePlace />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  } else {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Users />
        </Route>
        <Route path="/:userId/places" exact>
          <UserPlaces />
        </Route>
        <Route path="/auth">
          <Auth />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token: token,
        userId: userId,
        login: login,
        logout: logout,
        setIsLoading: setIsLoading,
      }}
    >
      <Router>
        <MainNavigation />
        {isLoading && (
          <div>
            <LoadingSpinner className={"loading-spinner-email-confirmation"} />
          </div>
        )}
        <main>{routes}</main>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
