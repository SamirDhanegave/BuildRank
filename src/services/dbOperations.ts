import { 
  collection, 
  doc, 
  writeBatch, 
  increment, 
  serverTimestamp, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Post, Comment, Like } from '../types';

/**
 * Creates a new project showcase post.
 * Adds +10 Points to the creating user's profile.
 */
export async function createPost(
  userId: string,
  username: string,
  userPhotoURL: string,
  title: string,
  description: string,
  tags: string[],
  link: string,
  imageURL: string
): Promise<string> {
  const batch = writeBatch(db);
  const postsCollectionRef = collection(db, 'posts');
  const newPostDocRef = doc(postsCollectionRef);
  const postId = newPostDocRef.id;

  const postData: Omit<Post, 'id'> = {
    userId,
    username,
    userPhotoURL: userPhotoURL || '',
    title,
    description,
    tags,
    link: link || '',
    imageURL: imageURL || '',
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    // 1. Create Post
    batch.set(newPostDocRef, postData);

    // 2. Add +10 reputation points to author profile
    const profileRef = doc(db, 'profiles', userId);
    batch.update(profileRef, {
      points: increment(10)
    });

    await batch.commit();
    return postId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
  }
}

/**
 * Likes a post.
 * Checks for uniqueness, adds a Like document, increments likesCount on post,
 * and adds +2 reputation points to the post owner's profile (if it's not their own post).
 */
export async function likePost(
  userId: string,
  postId: string,
  postOwnerId: string
): Promise<void> {
  const batch = writeBatch(db);
  const likeId = `${userId}_${postId}`;
  const likeRef = doc(db, 'likes', likeId);
  const postRef = doc(db, 'posts', postId);
  const profileRef = doc(db, 'profiles', postOwnerId);

  const likeData: Like = {
    id: likeId,
    userId,
    postId,
    createdAt: serverTimestamp()
  };

  try {
    // 1. Create unique Like document
    batch.set(likeRef, likeData);

    // 2. Increment post likes count
    batch.update(postRef, {
      likesCount: increment(1)
    });

    // 3. Increment post owner's reputation pointing by +2 if not their own post
    if (userId !== postOwnerId) {
      batch.update(profileRef, {
        points: increment(2)
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
  }
}

/**
 * Unlikes a post.
 * Deletes the Like document, decrements likesCount on post,
 * and decrements -2 reputation points from the post owner's profile.
 */
export async function unlikePost(
  userId: string,
  postId: string,
  postOwnerId: string
): Promise<void> {
  const batch = writeBatch(db);
  const likeId = `${userId}_${postId}`;
  const likeRef = doc(db, 'likes', likeId);
  const postRef = doc(db, 'posts', postId);
  const profileRef = doc(db, 'profiles', postOwnerId);

  try {
    // 1. Delete Like document
    batch.delete(likeRef);

    // 2. Decrement post likes count
    batch.update(postRef, {
      likesCount: increment(-1)
    });

    // 3. Decrement post owner's reputation points by -2 if not their own post
    if (userId !== postOwnerId) {
      batch.update(profileRef, {
        points: increment(-2)
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
  }
}

/**
 * Adds a comment on a post.
 * Creates a Comment document, increments commentsCount on post,
 * and adds +5 reputation points to the post owner's profile.
 */
export async function addComment(
  userId: string,
  postId: string,
  username: string,
  userPhotoURL: string,
  content: string,
  postOwnerId: string
): Promise<string> {
  const batch = writeBatch(db);
  const commentsCollectionRef = collection(db, 'comments');
  const commentDocRef = doc(commentsCollectionRef);
  const commentId = commentDocRef.id;

  const commentData: Omit<Comment, 'id'> = {
    userId,
    postId,
    username,
    userPhotoURL: userPhotoURL || '',
    content,
    createdAt: serverTimestamp(),
  };

  try {
    // 1. Create Comment document
    batch.set(commentDocRef, commentData);

    // 2. Increment commentsCount on Post
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      commentsCount: increment(1)
    });

    // 3. Add +5 reputation points to the post owner if not their own post
    if (userId !== postOwnerId) {
      const profileRef = doc(db, 'profiles', postOwnerId);
      batch.update(profileRef, {
        points: increment(5)
      });
    }

    await batch.commit();
    return commentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `comments/${commentId}`);
  }
}

/**
 * Removes a comment.
 * Deletes the Comment document, decrements commentsCount on post,
 * and decrements -5 reputation points from the post owner's profile if applicable.
 */
export async function deleteComment(
  commentId: string,
  postId: string,
  postOwnerId: string,
  commentAuthorId: string
): Promise<void> {
  const batch = writeBatch(db);
  const commentRef = doc(db, 'comments', commentId);
  const postRef = doc(db, 'posts', postId);
  const profileRef = doc(db, 'profiles', postOwnerId);

  try {
    // 1. Delete Comment document
    batch.delete(commentRef);

    // 2. Decrement commentsCount on Post
    batch.update(postRef, {
      commentsCount: increment(-1)
    });

    // 3. Decrement post owner's reputation points by -5 if the comment was not by the post owner themselves
    if (commentAuthorId !== postOwnerId) {
      batch.update(profileRef, {
        points: increment(-5)
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
  }
}

/**
 * Deletes a post.
 * Decrements the publisher's profile by -10 points as they withdrew the showcase.
 * (Optional but maintains score consistency)
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);
  const postRef = doc(db, 'posts', postId);
  const profileRef = doc(db, 'profiles', userId);

  try {
    // 1. Delete the post
    batch.delete(postRef);

    // 2. Deduct the initial +10 post creation points from the publisher
    batch.update(profileRef, {
      points: increment(-10)
    });

    // Note: To keep DB pristine, likes and comments can be optionally garbage collected,
    // but in V1 client side is structured elegantly on listing.
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
  }
}
