import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import { useHttpClient } from "../../shared/hooks/http-hook";
import "./PlaceList.css";
import Card from "../../shared/components/UIElements/Card";
import Button from "../../shared/components/FormElements/Button";
import PlaceItem from "./PlaceItem";

const PlaceList = (props) => {
  const { sendRequest } = useHttpClient();
  const auth = useContext(AuthContext);
  const [savedPosts, setSavedPosts] = useState([]);
  const updateSavedPosts = (postId, isSaved) => {
    if (isSaved) {
      setSavedPosts((prevSavedPosts) => [...prevSavedPosts, { _id: postId }]);
    } else {
      setSavedPosts((prevSavedPosts) =>
        prevSavedPosts.filter((p) => p._id !== postId)
      );
    }
  };

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/posts/savedposts/${auth.userId}`,
          "GET",
          null,
          {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          }
        );
        setSavedPosts(responseData.posts);
      } catch (err) {}
    };
    if (auth.isLoggedIn) {
      fetchSavedPosts();
    }
  }, [auth.isLoggedIn, auth.token, auth.userId, sendRequest]);

  if (props.items.length === 0 && props.userId === auth.userId) {
    return (
      <div className="place-list center">
        <Card>
          <h2>No posts found!</h2>
          <Button to="/places/new">Make Post</Button>
        </Card>
      </div>
    );
  } else if (props.items.length === 0) {
    return (
      <div className="center">
        <Card>
          <h2>No places found for this user!</h2>
        </Card>
      </div>
    );
  }

  return (
    <ul className="place-list">
      {props.items.map((place) => (
        <PlaceItem
          key={place.id}
          id={place.id}
          image={place.image}
          title={place.title}
          description={place.description}
          address={place.place.address}
          likes={place.likes}
          creatorId={place.creator}
          coordinates={place.place.location}
          isSaved={savedPosts.some((p) => p._id === place.id)}
          onDelete={props.onDeletePlace}
          onUpdateSavedPosts={updateSavedPosts}
        />
      ))}
    </ul>
  );
};

export default PlaceList;
