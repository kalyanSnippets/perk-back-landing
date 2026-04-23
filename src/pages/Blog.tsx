import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import PublicPageFrame from "@/components/shared/PublicPageFrame";
import { useEmbeddedPublicPage } from "@/hooks/useEmbeddedPublicPage";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string | null;
  published_at: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEmbedded, backHref } = useEmbeddedPublicPage();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blogs")
        .select("id, title, slug, excerpt, featured_image_url, author_name, published_at")
        .order("published_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PublicPageFrame isEmbedded={isEmbedded} backHref={backHref} title="Blog">
      <div className={isEmbedded ? "pt-2" : ""}>
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Blog</h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                Tips, updates, and insights about loyalty programs and growing your business.
              </p>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <ScrollReveal key={post.id} delay={i * 80}>
                  <Link
                    to={isEmbedded ? `/blog/${post.slug}?web=1` : `/blog/${post.slug}`}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card border border-border/50 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 flex flex-col h-full"
                  >
                    {post.featured_image_url && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-base font-bold text-foreground mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Calendar size={10} />
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString("en-AU", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "Draft"}
                        </div>
                        <span className="text-xs text-secondary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read More <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicPageFrame>
  );
};

export default Blog;
