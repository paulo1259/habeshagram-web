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
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
      followerCount: 2,
      followingCount: 1
    },
    {
      id: "user_2",
      username: "asmara.vibes",
      email: "asmara@habeshagram.com",
      profileImageURL: "",
      bio: "Sharing Eritrean food, family stories, and small city moments.",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 80).toISOString(),
      followerCount: 1,
      followingCount: 1
    },
    {
      id: "user_3",
      username: "addis.matchday",
      email: "matchday@habeshagram.com",
      profileImageURL: "",
      bio: "Premier League takes, memes, and late kickoff reactions from Addis.",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 65).toISOString(),
      followerCount: 1,
      followingCount: 2
    },
    {
      id: "user_4",
      username: "habesha.fitcheck",
      email: "fitcheck@habeshagram.com",
      profileImageURL: "",
      bio: "Street style, football shirts, and weekend looks with Habesha energy.",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 50).toISOString(),
      followerCount: 0,
      followingCount: 1
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
      hashtags: ["habesha", "buna", "addis"],
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
      hashtags: ["habesha", "music", "eritrea"],
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
      hashtags: ["addis", "ethiopia", "style"],
      createdAt: new Date(now - 1000 * 60 * 60 * 9).toISOString(),
      likeCount: 12,
      commentCount: 0,
      likedBy: []
    },
    {
      id: "post_4",
      userId: "user_3",
      username: "addis.matchday",
      userProfileImageURL: "",
      text: "United fans in Addis are arguing about whether the midfield needs more control or more chaos. I am still leaning chaos, respectfully.",
      imageURL: "",
      teamTag: "Manchester United",
      hashtags: ["ggmu", "addis", "premierleague"],
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
      likeCount: 21,
      commentCount: 3,
      likedBy: ["user_1", "user_4"]
    },
    {
      id: "post_5",
      userId: "user_4",
      username: "habesha.fitcheck",
      userProfileImageURL: "",
      text: "Arsenal kits and clean white sneakers might be the strongest matchday combo in the whole league. No one is changing my mind.",
      imageURL: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
      teamTag: "Arsenal",
      hashtags: ["coyg", "arsenal", "matchday"],
      createdAt: new Date(now - 1000 * 60 * 95).toISOString(),
      likeCount: 14,
      commentCount: 1,
      likedBy: ["user_2"]
    },
    {
      id: "post_6",
      userId: "user_2",
      username: "asmara.vibes",
      userProfileImageURL: "",
      text: "Chelsea group chats really know how to turn every young player rumor into a full-blown scouting report by midnight.",
      imageURL: "",
      teamTag: "Chelsea",
      hashtags: ["cfc", "transferbuzz", "habesha"],
      createdAt: new Date(now - 1000 * 60 * 150).toISOString(),
      likeCount: 11,
      commentCount: 0,
      likedBy: ["user_3"]
    },
    {
      id: "post_7",
      userId: "user_3",
      username: "addis.matchday",
      userProfileImageURL: "",
      text: "City might make control look too easy, but Addis timelines still find a way to debate every tiny tactical detail after the match.",
      imageURL: "",
      teamTag: "Manchester City",
      hashtags: ["mcfc", "matchday", "addis"],
      createdAt: new Date(now - 1000 * 60 * 210).toISOString(),
      likeCount: 8,
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
  follows: [
    {
      followerId: "user_2",
      followingId: "user_1",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString()
    },
    {
      followerId: "user_3",
      followingId: "user_1",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString()
    },
    {
      followerId: "user_1",
      followingId: "user_2",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString()
    },
    {
      followerId: "user_3",
      followingId: "user_2",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString()
    },
    {
      followerId: "user_4",
      followingId: "user_3",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString()
    }
  ],
  notifications: [
    {
      id: "notification_1",
      type: "like",
      recipientUserId: "user_1",
      actorUserId: "user_2",
      actorUsername: "asmara.vibes",
      actorProfileImageURL: "",
      targetPostId: "post_1",
      message: "liked your post",
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 40).toISOString()
    },
    {
      id: "notification_2",
      type: "follow",
      recipientUserId: "user_1",
      actorUserId: "user_3",
      actorUsername: "addis.matchday",
      actorProfileImageURL: "",
      message: "started following you",
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 90).toISOString()
    }
  ],
  reports: [],
  savedPosts: [
    {
      userId: "user_1",
      postId: "post_2",
      savedAt: new Date(now - 1000 * 60 * 55).toISOString()
    }
  ],
  currentUserId: null
};
