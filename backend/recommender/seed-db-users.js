const mongoose = require("mongoose");
const User = require("../models/user");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const photos = [
  ,
  "ddc45bc1-6844-4c27-9b8b-ecc04a77f22c",
  "d867b0d6-45e0-4b5e-8663-e72272618222",
  "3dae3829-fa5e-47cd-9716-bb5823a446c5",
  "ec4dc878-a404-4f66-8142-2cbc052c658f",
  "8a543c77-984a-4789-b98f-71c3c7ad9198",
  "d7de484c-6a5f-4483-af0b-3db97221ab02",
  "b47e2cca-c9b3-4b03-84d6-c1ebf82a58df",
  "ddc3d1d7-0e4a-4637-b92a-d175279a0029",
  "669fdbeb-332a-4d91-b054-26f37bcd370f",
  "fa035c89-cdd1-439c-9999-2da52f68abc6",
  "b77b1ba9-3747-4da1-a9c3-72479f049207",
  "ad35006b-a2c7-4411-91ca-634319ef5f6a",
  "87db1fab-98e2-42f2-9926-514f2f8f4235",
  "7e1b3944-6692-496c-b693-01829160cd50",
  "5f1c808a-c2be-4274-afc1-197822251fdb",
  "a4437762-e8a7-4c23-9b98-51116ecb35f4",
  "e990a9fc-2ec6-43d9-9159-32b227c693c3",
  "0bddd862-4a83-4615-9b4d-8a274f3c4eb3",
  "00f8b4a7-d3c8-4f6e-a652-52c1c4d00f98",
  "28034824-6750-49e5-bea0-e4c3876f0e9f",
  "9913b7a3-e6b4-4043-9e0e-303194e6879c",
  "a2758030-cf09-488d-9d60-267bc7039117",
  "8a6ac36c-f366-41c8-a736-7a561ee169d7",
  "56af96f3-086b-4cd8-83b2-bd5fb9bd0887",
  "e94f5c2e-3c9f-41ce-910d-4c2ea981dcae",
];

const users = [];
async function generateUsers() {
  for (let i = 0; i < 500; i++) {
    let password = faker.internet.password();
    users.push({
      name: `${faker.name.firstName()} ${faker.name.lastName()}`,
      password: await bcrypt.hash(password, 12),
      email: faker.internet.email(),
      image: `uploads/images/${
        photos[Math.floor(Math.random() * photos.length)]
      }.jpg`,
      savedPosts: [],
      createdPosts: [],
    });

    if (i === 0) {
      console.log(password);
    }
  }
}

async function saveUsers() {
  try {
    await mongoose.connect(
      ``
    ); // mern = db name
    console.log("Successfully connected to db!");

    await generateUsers();

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await User.insertMany(users, { session: sess });
    await sess.commitTransaction();
    console.log("Users saved to database!");
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

saveUsers();
