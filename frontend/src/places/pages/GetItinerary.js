import React, { useContext, useState } from "react";
import Modal from "../../shared/components/UIElements/Modal";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_RANGE,
} from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import { useHttpClient } from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import "./PlaceForm.css";

const GetItinerary = () => {
  const auth = useContext(AuthContext);
  const { error, sendRequest, clearError } = useHttpClient();
  const [showModal, setshowModal] = useState(false);
  const cancelModal = () => {
    setshowModal(false);
  };
  const [formState, inputHandler] = useForm(
    {
      location: {
        value: "",
        isValid: false,
      },
      nrDays: {
        value: "",
        isValid: false,
      },
      nrPersons: {
        value: "",
        isValid: false,
      },
    },
    false
  );

  const placeSubmitHandler = async (event) => {
    event.preventDefault();
    auth.setIsLoading(true);
    try {
      await sendRequest(
        process.env.REACT_APP_BACKEND_URL + `/posts/itinerary/${auth.userId}`,
        "POST",
        JSON.stringify({
          location: formState.inputs.location.value,
          nrDays: formState.inputs.nrDays.value,
          nrPersons: formState.inputs.nrPersons.value,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      setshowModal(true);
    } catch (err) {}
    auth.setIsLoading(false);
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <Modal
        show={showModal}
        onCancel={cancelModal}
        header="Email Sent"
        contentClass="modal-content"
        footerClass="place_item__modal-actions"
        footer={<Button onClick={cancelModal}>CLOSE</Button>}
      >
        <p>An email with your itinerary was sent!</p>
      </Modal>
      <form className="place-form" onSubmit={placeSubmitHandler}>
        <Input
          id="location"
          element="input"
          type="text"
          label="Location"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a location!"
          onInput={inputHandler}
        />
        <Input
          id="nrDays"
          element="input"
          type="text"
          label="Number of Days"
          validators={[VALIDATOR_RANGE(1, 15)]}
          errorText="Please enter a valid number of days (between 1 and 15)!"
          onInput={inputHandler}
        />
        <Input
          id="nrPersons"
          element="input"
          type="text"
          label="Number of Persons"
          validators={[VALIDATOR_RANGE(1, 15)]}
          errorText="Please enter a valid number of days (between 1 and 15)!"
          onInput={inputHandler}
        />
        <Button type="submit" disabled={!formState.isValid}>
          GET ITINERARY
        </Button>
      </form>
    </React.Fragment>
  );
};

export default GetItinerary;
