import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import PlaceList from "../components/PlaceList";
import { AuthContext } from "../../shared/context/auth-context";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";

const UserPlaces = () => {
  const [loadedPlaces, setLoadedPlaces] = useState([]);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const auth = useContext(AuthContext);
  const userId = useParams().userId;

  useEffect(() => {
    const fetchPlaces = async () => {
      const requestURI =
        auth.isLoggedIn !== false
          ? `${process.env.REACT_APP_BACKEND_URL}/posts/user/${userId}/${auth.userId}`
          : `${process.env.REACT_APP_BACKEND_URL}/posts/user/${userId}`;
      try {
        const responseData = await sendRequest(requestURI);
        setLoadedPlaces(responseData.posts);
      } catch (err) {
        setLoadedPlaces([]);
      }
    };
    fetchPlaces();
  }, [auth.isLoggedIn, auth.userId, sendRequest, userId]);

  const placeDeletedHandler = (deletedPlaceId) => {
    setLoadedPlaces((prevPlaces) =>
      prevPlaces.filter((place) => place.id !== deletedPlaceId)
    );
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && (
        <PlaceList
          items={loadedPlaces != null ? loadedPlaces : []}
          userId={userId}
          onDeletePlace={placeDeletedHandler}
        />
      )}
    </React.Fragment>
  );
};

export default UserPlaces;
