import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, User } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface BlogData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string | null;
  published_at: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to Blog
          </Link>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : !post ? (
            <div className="text-center py-16">
              <h2 className="text-xl font-bold text-foreground mb-2">Post Not Found</h2>
              <p className="text-muted-foreground text-sm">This blog post doesn't exist or has been removed.</p>
            </div>
          ) : (
            <ScrollReveal>
              <article>
                {post.featured_image_url && (
                  <div className="rounded-2xl overflow-hidden mb-6 aspect-video bg-muted">
                    <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{post.title}</h1>

                <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
                  {post.author_name && (
                    <span className="flex items-center gap-1.5">
                      <User size={14} /> {post.author_name}
                    </span>
                  )}
                  {post.published_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(post.published_at).toLocaleDateString("en-AU", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <div
                  className="prose prose-sm sm:prose-base max-w-none text-foreground/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                />
              </article>
            </ScrollReveal>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
