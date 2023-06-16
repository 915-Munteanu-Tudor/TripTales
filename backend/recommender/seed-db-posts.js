const mongoose = require("mongoose");
const User = require("../models/user");
const Place = require("../models/place");
const Post = require("../models/post");

const descriptions = [
  "Explore breathtaking landscapes and stunning natural beauty.",
  "Immerse yourself in the rich history and culture of the region.",
  "Indulge in delicious local cuisine and culinary delights.",
  "Experience thrilling adventures and outdoor activities.",
  "Relax and unwind on pristine beaches with crystal-clear waters.",
  "Discover hidden gems and off-the-beaten-path attractions.",
  "Marvel at iconic landmarks and architectural wonders.",
  "Engage in vibrant festivals and lively nightlife.",
  "Embrace the serenity of tranquil mountains and lush greenery.",
  "Immerse in the vibrant colors and traditions of local markets.",
  "Embark on a journey of self-discovery and personal growth.",
  "Savor the beauty of sunset views and breathtaking panoramas.",
  "Connect with nature and witness rare wildlife in their habitats.",
  "Get lost in the labyrinth of narrow streets and charming alleyways.",
  "Unleash your adventurous spirit with thrilling water sports.",
  "Delve into the ancient ruins and archaeological sites.",
  "Immerse in the rich tapestry of art and cultural heritage.",
  "Escape to secluded islands and private paradises.",
  "Stroll through picturesque gardens and botanical wonders.",
  "Indulge in rejuvenating spa treatments and wellness retreats.",
  "Embark on a gastronomic journey of unique flavors and tastes.",
  "Experience the warmth and hospitality of local communities.",
  "Witness the magic of dazzling city skylines and night lights.",
  "Immerse in the tranquility of peaceful lakes and serene waterscapes.",
  "Uncover the secrets of hidden caves and mystical landscapes.",
];

const titles = [
  "A Paradise for Nature Lovers",
  "Discover the Cultural Marvels",
  "Unforgettable Adventures Await",
  "Beach Bliss and Ocean Breezes",
  "Off-the-Beaten-Path Gems",
  "Architectural Wonders",
  "Where Festivals Come Alive",
  "In the Lap of Majestic Mountains",
  "Colors and Flavors of Local Markets",
  "Journey of Self-Discovery",
  "Mesmerizing Sunset Views",
  "Wildlife Encounters",
  "Lost in the Charm of Narrow Streets",
  "Thrills of Water Sports",
  "Ancient Ruins Revealed",
  "Art and Cultural Delights",
  "Secluded Island Getaways",
  "Enchanting Gardens and Botanical Marvels",
  "Wellness and Tranquility",
  "Culinary Delights",
  "Warmth of Local Hospitality",
  "City Lights and Skyline Spectacles",
  "Tranquil Lakeside Retreats",
  "Mystical Caves and Landscapes",
];

const photos = [
  "23abde71-2131-4583-aeb0-60733ebc0387",
  "a4c81991-914f-456e-a379-3afc3289f61b",
  "8e275bb3-925e-4508-a3ef-0ffdac57a78b",
  "3f409960-a397-4158-aef8-d3bd7bf81aed",
  "4995e697-697d-4e18-906a-ed9f788a6720",
  "f67d2e86-7944-4065-a18c-c7ccb66bdc26",
  "9fde780a-d3d0-4967-b7a1-cf57e43b29d9",
  "daf8ba0d-4886-46ba-b8d0-348d36ce6fc5",
  "45cc0e73-49e6-48c2-b474-7dd4757dafef",
  "6bb592ed-6dc2-4274-84c5-95dfb9875009",
  "9125f20b-abdb-458b-8126-570eb8e040e7",
  "95ee59c1-24c0-454e-8004-d7ba98178ee0",
  "ffdd4868-f07e-4246-9c20-dfe87c464a2b",
  "d2f15c68-ab27-4db1-9cde-2a92887f9724",
  "d61a8aa1-5631-48cb-ac80-96c2cb5616ef",
  "505aa93f-d26e-48fa-a1d1-6ae8e3b0e6c9",
  "8af5aab3-5421-471d-b671-48fb5eacc5bc",
  "2c2b4a19-4e2a-412e-a664-a364f88b9fb4",
  "1db7ed8d-5bbf-4b81-a879-1a9d9148a456",
  "9e83c776-78ab-4d35-82fc-233f4e1b3e9d",
  "dd915afe-6450-40f3-b725-2125655d52d6",
  "1ff537a7-0399-4d21-99bd-345a0fe9b7b4",
  "745b1073-26af-4864-a741-17ca0b416fcf",
  "77b81107-5d4e-4ca8-9604-71c185b6c1de",
  "a2a7ed2e-2191-4dfd-8b3b-97cef8842e6b",
];

async function generatePosts() {
  try {
    await mongoose.connect(
      ``
    ); // mern = db name
    console.log("Successfully connected to db!");

    const users = await User.find().select("_id createdPosts").lean();
    const places = await Place.find().select("_id").lean(); // get all place ids

    const posts = [];

    for (const user of users) {
      const userPlaces = shuffleArray(places).slice(0, 30); // Get 30 unique random places

      for (let i = 0; i < 30; i++) {
        const post = {
          title: titles[Math.floor(Math.random() * titles.length)],
          description:
            descriptions[Math.floor(Math.random() * descriptions.length)],
          image: `uploads/images/${
            photos[Math.floor(Math.random() * photos.length)]
          }.jpg`,
          rating: getRandomRating(), // Generate a random rating between 1 and 10
          likes: [],
          viewedBy: getRandomUsers(users), // Generate a random view count between 0 and nrUsers
          creator: user._id,
          place: userPlaces[i]._id, // select the random place for this post
        };
        const postDocument = new Post(post);
        posts.push(postDocument);
        user.createdPosts.push(postDocument._id);
      }
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Post.insertMany(posts, { session: sess });
    await Promise.all(
      users.map(async (user) => {
        await User.findByIdAndUpdate(
          user._id,
          { createdPosts: user.createdPosts },
          { session: sess }
        );
      })
    );
    await sess.commitTransaction();
    console.log("Posts saved to database!");
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function getRandomUsers(users) {
  const shuffledUsers = shuffleArray(users);
  const count = Math.floor(Math.random() * shuffledUsers.length);

  return shuffledUsers.slice(0, count).map((user) => user._id);
}

function getRandomRating() {
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const weights = [1, 1, 1, 3, 3, 3, 3, 3, 2, 2]; // Assign higher weights to ratings between 4 and 8

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const randomWeight = Math.random() * weightSum;
  let currentWeight = 0;

  for (let i = 0; i < ratings.length; i++) {
    currentWeight += weights[i];
    if (currentWeight >= randomWeight) {
      return ratings[i];
    }
  }
}

generatePosts();
