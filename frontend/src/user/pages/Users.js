import React, { useEffect, useState } from "react";
import { VALIDATOR_MINLENGTH } from "../../shared/util/validators";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import UsersList from "../components/UsersList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";
import { useForm } from "../../shared/hooks/form-hook";
import "../pages/SearchUserForm.css";

const Users = () => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedUsers, setLoadedUsers] = useState();
  const [formState, inputHandler] = useForm(
    {
      searchQuery: {
        value: "",
        isValid: false,
      },
    },
    false
  );

  const searchUsersSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const responseData = await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/users/searchUsers/${formState.inputs.searchQuery.value}`
      );
      setLoadedUsers(responseData.users);
    } catch (err) {}
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const responseData = await sendRequest(
          process.env.REACT_APP_BACKEND_URL + "/users"
        );
        setLoadedUsers(responseData.users);
      } catch (err) {}
    };
    fetchUsers();
  }, [sendRequest]);

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
      <div>
        {!isLoading && (
          <form className="user-form" onSubmit={searchUsersSubmitHandler}>
            <Input
              id="searchQuery"
              element="input"
              type="text"
              label="Search Users"
              validators={[VALIDATOR_MINLENGTH(1)]}
              errorText="Please enter a name!"
              onInput={inputHandler}
            />
            <Button type="submit" disabled={!formState.isValid} display>
              SEARCH
            </Button>
          </form>
        )}
        {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
      </div>
    </React.Fragment>
  );
};

export default Users;
