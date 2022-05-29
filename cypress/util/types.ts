export type NewUser = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
};

export const getUser = (): NewUser => {
  return {
    firstName: "Bob",
    lastName: "Ross",
    username: "PainterJoy90",
    password: "s3cret",
  };
};
