import { AppState } from "@/types";

const now = Date.now();

export const initialState: AppState = {
  users: [
    {
      id: "user_1",
      username: "selam.addis",
      email: "selam@habeshagram.com",
      profileImageURL: "",
      bio: "Coffee, culture, style, music, and everyday Habesha life.",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString()
    },
    {
      id: "user_2",
      username: "asmara.vibes",
      email: "asmara@habeshagram.com",
      profileImageURL: "",
      bio: "Sharing Eritrean food, family stories, and small city moments.",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 80).toISOString()
    }
  ],
  posts: [
    {
      id: "post_1",
      userId: "user_1",
      username: "selam.addis",
      userProfileImageURL: "",
      text: "Nothing beats buna and a slow family catch-up on a bright morning. What is your favorite Habesha comfort ritual?",
      imageURL: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      likeCount: 18,
      commentCount: 2,
      likedBy: ["user_2"]
    },
    {
      id: "post_2",
      userId: "user_2",
      username: "asmara.vibes",
      userProfileImageURL: "",
      text: "What songs belong on the ultimate Habesha road trip playlist? I want classics and new favorites.",
      imageURL: "",
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      likeCount: 9,
      commentCount: 1,
      likedBy: ["user_1"]
    },
    {
      id: "post_3",
      userId: "user_1",
      username: "selam.addis",
      userProfileImageURL: "",
      text: "Market colors today were unreal.",
      imageURL: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(now - 1000 * 60 * 60 * 9).toISOString(),
      likeCount: 12,
      commentCount: 0,
      likedBy: []
    }
  ],
  comments: [
    {
      id: "comment_1",
      postId: "post_1",
      userId: "user_2",
      username: "asmara.vibes",
      text: "Fresh popcorn with coffee is the answer every time.",
      createdAt: new Date(now - 1000 * 60 * 60).toISOString()
    },
    {
      id: "comment_2",
      postId: "post_1",
      userId: "user_1",
      username: "selam.addis",
      text: "And soft injera the next day.",
      createdAt: new Date(now - 1000 * 60 * 30).toISOString()
    },
    {
      id: "comment_3",
      postId: "post_2",
      userId: "user_1",
      username: "selam.addis",
      text: "Teddy Afro has to be on it.",
      createdAt: new Date(now - 1000 * 60 * 90).toISOString()
    }
  ],
  currentUserId: null
};
