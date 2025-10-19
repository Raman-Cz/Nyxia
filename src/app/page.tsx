import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();
  const posts = await getPosts();
  const dbUserId = await getDbUserId();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
      <div className={user ? "lg:col-span-6" : "lg:col-span-10"}>
        {user ? <CreatePost /> : null}

      <div className="columns-1 sm:columns-2 md:columns-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-4">
              <PostCard post={post} dbUserId={dbUserId} />
            </div>
          ))}
      </div>

      </div>

     {user && (
        <div className="hidden lg:block lg:sticky lg:col-span-2 top-20">
          <WhoToFollow />
        </div>
      )}
    </div>
  );
}
