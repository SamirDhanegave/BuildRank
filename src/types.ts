export interface Profile {
  uid: string;
  username: string;
  bio: string;
  skills: string[];
  points: number;
  photoURL: string;
  email: string;
  createdAt: any; // Firestore Timestamp
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userPhotoURL: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
  imageURL: string;
  likesCount: number;
  commentsCount: number;
  createdAt: any; // Firestore Timestamp
}

export interface Like {
  id: string; // userId_postId
  userId: string;
  postId: string;
  createdAt: any; // Firestore Timestamp
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  username: string;
  userPhotoURL: string;
  content: string;
  createdAt: any; // Firestore Timestamp
}
