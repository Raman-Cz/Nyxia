"use client";

import { createComment, deletePost, getPosts, toggleLike, toggleBookmark } from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";

import { updatePost } from "@/actions/post.action";
import { EditIcon, BookmarkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "./ui/dialog";
import { Label } from "./ui/label";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like) => like.userId === dbUserId));
  const [optimisticLikes, setOptmisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content ?? "");
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [hasBookmarked, setHasBookmarked] = useState(post.bookmarks.some((bookmark) => bookmark.userId === dbUserId)
  );

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptmisticLikes((prev) => prev + (hasLiked ? -1 : 1));
      await toggleLike(post.id);
    } catch (error) {
      setOptmisticLikes(post._count.likes);
      setHasLiked(post.likes.some((like) => like.userId === dbUserId));
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result.success) toast.success("Post deleted successfully");
      else throw new Error(result.error);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editedContent || isEditing) return;
    setIsEditing(true);
    try {
      const result = await updatePost(post.id, editedContent);
      if (result.success) {
        toast.success("Post updated successfully");
        // You might need to close the dialog here, see Dialog usage
      } else {
        toast.error(result.error || "Failed to update post");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    try {
      setIsBookmarking(true);
      // Optimistic update
      setHasBookmarked((prev) => !prev);
      await toggleBookmark(post.id);
    } catch (error) {
      // Revert on error
      toast.error("Failed to update bookmark");
      setHasBookmarked((prev) => !prev);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-none">
      {/* POST IMAGE now at the top, taking full width */}
      {post.image && (
        <img src={post.image} alt="Post content" className="w-full h-auto p-1" />
      )}

      {/* Container for all content below the image */}
      <div className="p-3">
        {/* HEADER SECTION */}
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar className="size-9">
              <AvatarImage src={post.author.image ?? "/avatar.png"} />
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2 truncate">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-semibold text-sm truncate text-primary"
                >
                  {post.author.name}
                </Link>
                
              </div>
              {dbUserId === post.author.id && (
        <div className="flex items-center">
          {/* EDIT DIALOG TRIGGER */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary -mr-2">
                <EditIcon className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="post-content">Post Content</Label>
                <Textarea
                  id="post-content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="mt-2 min-h-[150px]"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpdatePost} disabled={isEditing}>
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
        </div>
      )}
              
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </p>
          </div>
        </div>

        {/* POST CONTENT TEXT (if any) */}
        {post.content && (
          <p className="text-sm text-foreground break-words mt-3">{post.content}</p>
        )}

        {/* LIKE & COMMENT BUTTONS */}
        <div className="flex items-center space-x-2 mt-3">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted-foreground gap-1.5 ${
                hasLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
              }`}
              onClick={handleLike}
            >
              {hasLiked ? (
                <HeartIcon className="size-4 fill-current" />
              ) : (
                <HeartIcon className="size-4" />
              )}
              <span className="text-xs">{optimisticLikes}</span>
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                <HeartIcon className="size-4" />
                <span className="text-xs">{optimisticLikes}</span>
              </Button>
            </SignInButton>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 hover:text-blue-500"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <MessageCircleIcon
              className={`size-4 ${showComments ? "fill-blue-500 text-blue-500" : ""}`}
            />
            <span className="text-xs">{post.comments.length}</span>
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5 hover:text-primary"
              onClick={handleBookmark}
              disabled={isBookmarking}
            >
              <BookmarkIcon
                className={`size-4 ${hasBookmarked ? "fill-primary text-primary" : ""}`}
              />
            </Button>
          )}
        </div>
          
        {/* COMMENTS SECTION */}
        {showComments && (
          <div className="space-y-3 pt-3 mt-3 border-t">
            {/* DISPLAY COMMENTS */}
            {post.comments.length > 0 && post.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <Avatar className="size-7 flex-shrink-0">
                  <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                </Avatar>
                <div className="flex-1 min-w-0 bg-muted/50 rounded-lg p-2">
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="font-medium text-xs">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm break-words">{comment.content}</p>
                </div>
              </div>
            ))}

            {/* ADD COMMENT FORM */}
            {user ? (
              <div className="flex space-x-2">
                <Avatar className="size-7 flex-shrink-0">
                  <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      className="flex items-center gap-2"
                      disabled={!newComment.trim() || isCommenting}
                    >
                      {isCommenting ? "..." : <SendIcon className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}
export default PostCard;

