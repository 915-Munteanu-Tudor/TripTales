import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_PASSWORD,
} from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import { useHttpClient } from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import "../../places/pages/PlaceForm.css";

const ChangePassword = () => {
  const auth = useContext(AuthContext);
  const { error, sendRequest, clearError } = useHttpClient();
  const history = useHistory();
  const [formState, inputHandler] = useForm(
    {
      oldPassword: {
        value: "",
        isValid: false,
      },
      newPassword: {
        value: "",
        isValid: false,
      },
      confirmPassword: {
        value: "",
        isValid: false,
      },
    },
    false
  );

  const changePasswordSubmitHandler = async (event) => {
    event.preventDefault();
    auth.setIsLoading(true);
    try {
      await sendRequest(
        process.env.REACT_APP_BACKEND_URL +
          `/users/changepassword/${auth.userId}`,
        "POST",
        JSON.stringify({
          oldPassword: formState.inputs.oldPassword.value,
          password: formState.inputs.newPassword.value,
          confirmPassword: formState.inputs.confirmPassword.value,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      history.push("/");
    } catch (err) {
    } finally {
      auth.setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <form className="place-form" onSubmit={changePasswordSubmitHandler}>
        <Input
          id="oldPassword"
          element="input"
          type="password"
          label="Old Password"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter the Old Password!"
          onInput={inputHandler}
        />
        <Input
          id="newPassword"
          element="input"
          type="password"
          label="New Password"
          validators={[VALIDATOR_PASSWORD()]}
          errorText="Password must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character, 8 characters."
          onInput={inputHandler}
        />
        <Input
          id="confirmPassword"
          element="input"
          type="password"
          label="Confirm Password"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter the Password confirmation!"
          onInput={inputHandler}
        />
        <Button type="submit" disabled={!formState.isValid}>
          SAVE
        </Button>
      </form>
    </React.Fragment>
  );
};

export default ChangePassword;
