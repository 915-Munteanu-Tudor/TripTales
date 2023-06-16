import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import { useParams } from "react-router-dom";
import PlaceList from "../components/PlaceList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";

const SavedPosts = () => {
  const [loadedPosts, setLoadedPosts] = useState();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const auth = useContext(AuthContext);
  const userId = useParams().userId;

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/posts/savedposts/${userId}`,
          "GET",
          null,
          {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          }
        );
        setLoadedPosts(responseData.posts);
      } catch (err) {}
    };
    fetchPlaces();
  }, [auth.token, sendRequest, userId]);

  const unsavePostdHandler = (unsavedPostId) => {
    setLoadedPosts((prevPosts) =>
      prevPosts.filter((post) => post.id !== unsavedPostId)
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
      {!isLoading && loadedPosts && (
        <PlaceList items={loadedPosts} onUnsavePost={unsavePostdHandler} />
      )}
    </React.Fragment>
  );
};

export default SavedPosts;
