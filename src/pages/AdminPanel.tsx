import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import UsersTab from "@/components/admin/UsersTab";
import {
  Pencil, Trash2, Plus, Save, X, Eye, EyeOff,
  FileText, MessageSquare, Mail, Users, Bold, Italic,
  List, ListOrdered, Heading1, Heading2, ImageIcon, Undo, Redo, Quote
} from "lucide-react";

/* ── Types ── */
interface Blog {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; featured_image_url: string | null; author_name: string | null;
  published_at: string | null; is_published: boolean; created_at: string;
}
interface Testimonial {
  id: string; name: string; role: string | null; business_name: string | null;
  message: string; rating: number | null; is_published: boolean;
  profile_image_url: string | null; created_at: string;
}
interface ContactMsg {
  id: string; name: string; email: string; business_name: string | null;
  message: string; created_at: string;
}

/* ── Tiptap Toolbar ── */
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  const btn = "p-1.5 rounded hover:bg-muted transition-colors";
  const active = "bg-muted text-foreground";
  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-muted/30">
      <button type="button" className={`${btn} ${editor.isActive("bold") ? active : ""}`} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></button>
      <button type="button" className={`${btn} ${editor.isActive("italic") ? active : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
      <button type="button" className={`${btn} ${editor.isActive("heading", { level: 1 }) ? active : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={16} /></button>
      <button type="button" className={`${btn} ${editor.isActive("heading", { level: 2 }) ? active : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></button>
      <button type="button" className={`${btn} ${editor.isActive("bulletList") ? active : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></button>
      <button type="button" className={`${btn} ${editor.isActive("orderedList") ? active : ""}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
      <button type="button" className={`${btn} ${editor.isActive("blockquote") ? active : ""}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></button>
      <button type="button" className={btn} onClick={() => { const url = prompt("Image URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }}><ImageIcon size={16} /></button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <button type="button" className={btn} onClick={() => editor.chain().focus().undo().run()}><Undo size={16} /></button>
      <button type="button" className={btn} onClick={() => editor.chain().focus().redo().run()}><Redo size={16} /></button>
    </div>
  );
};

/* ── Slug helper ── */
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useAuth();

  /* ── Blog state ── */
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [blogForm, setBlogForm] = useState({ title: "", slug: "", excerpt: "", featured_image_url: "", author_name: "", is_published: false });

  /* ── Testimonials state ── */
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  /* ── Contact state ── */
  const [contacts, setContacts] = useState<ContactMsg[]>([]);

  /* ── Tiptap editor ── */
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: "",
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none text-foreground" },
    },
  });

  /* ── Fetch data ── */
  const fetchBlogs = useCallback(async () => {
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setBlogs(data || []);
  }, []);

  const fetchTestimonials = useCallback(async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setTestimonials(data || []);
  }, []);

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setContacts(data || []);
  }, []);

  useEffect(() => {
    if (!roleLoading && !isAdmin) { navigate("/"); return; }
    if (!roleLoading && isAdmin) { fetchBlogs(); fetchTestimonials(); fetchContacts(); }
  }, [isAdmin, roleLoading, navigate, fetchBlogs, fetchTestimonials, fetchContacts]);

  /* ── Blog CRUD ── */
  const openBlogEditor = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title, slug: blog.slug, excerpt: blog.excerpt || "",
        featured_image_url: blog.featured_image_url || "", author_name: blog.author_name || "",
        is_published: blog.is_published,
      });
      editor?.commands.setContent(blog.content || "");
    } else {
      setEditingBlog({});
      setBlogForm({ title: "", slug: "", excerpt: "", featured_image_url: "", author_name: "", is_published: false });
      editor?.commands.setContent("");
    }
  };

  const saveBlog = async () => {
    const content = editor?.getHTML() || "";
    if (!blogForm.title.trim() || !content.trim()) { toast.error("Title and content are required"); return; }
    const slug = blogForm.slug || slugify(blogForm.title);
    const payload = {
      title: blogForm.title, slug, excerpt: blogForm.excerpt || null,
      content, featured_image_url: blogForm.featured_image_url || null,
      author_name: blogForm.author_name || null, is_published: blogForm.is_published,
      published_at: blogForm.is_published ? new Date().toISOString() : null,
    };

    if (editingBlog?.id) {
      const { error } = await supabase.from("blogs").update(payload).eq("id", editingBlog.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Blog updated");
    } else {
      const { error } = await supabase.from("blogs").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Blog created");
    }
    setEditingBlog(null);
    fetchBlogs();
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await supabase.from("blogs").delete().eq("id", id);
    toast.success("Blog deleted");
    fetchBlogs();
  };

  /* ── Testimonial moderation ── */
  const toggleTestimonialPublish = async (id: string, current: boolean) => {
    await supabase.from("testimonials").update({ is_published: !current }).eq("id", id);
    toast.success(!current ? "Published" : "Unpublished");
    fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    toast.success("Testimonial deleted");
    fetchTestimonials();
  };

  if (roleLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Admin Panel</h1>

          <Tabs defaultValue="blogs" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="blogs" className="gap-1.5"><FileText size={14} /> Blogs</TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-1.5"><MessageSquare size={14} /> Testimonials</TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1.5"><Mail size={14} /> Messages</TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5"><Users size={14} /> Users</TabsTrigger>
            </TabsList>

            {/* ═══ BLOGS TAB ═══ */}
            <TabsContent value="blogs">
              {editingBlog !== null ? (
                <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground">{editingBlog.id ? "Edit Blog" : "New Blog"}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setEditingBlog(null)}><X size={18} /></Button>
                  </div>
                  <Input placeholder="Title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value, slug: blogForm.slug || slugify(e.target.value) })} />
                  <Input placeholder="Slug" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} />
                  <Input placeholder="Excerpt" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} />
                  <Input placeholder="Featured Image URL" value={blogForm.featured_image_url} onChange={(e) => setBlogForm({ ...blogForm, featured_image_url: e.target.value })} />
                  <Input placeholder="Author Name" value={blogForm.author_name} onChange={(e) => setBlogForm({ ...blogForm, author_name: e.target.value })} />
                  <div className="border border-border rounded-xl overflow-hidden bg-background">
                    <EditorToolbar editor={editor} />
                    <EditorContent editor={editor} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={blogForm.is_published} onCheckedChange={(v) => setBlogForm({ ...blogForm, is_published: v })} />
                    <span className="text-sm text-muted-foreground">Publish immediately</span>
                  </div>
                  <Button onClick={saveBlog} className="gap-2"><Save size={16} /> Save Blog</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => openBlogEditor()} className="gap-2"><Plus size={16} /> New Blog Post</Button>
                  {blogs.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">No blog posts yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {blogs.map((blog) => (
                        <div key={blog.id} className="bg-card rounded-xl p-4 border border-border/50 flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground text-sm truncate">{blog.title}</h3>
                              {blog.is_published ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 font-medium">Published</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Draft</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{blog.excerpt || "No excerpt"}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(blog.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => openBlogEditor(blog)}><Pencil size={14} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteBlog(blog.id)}><Trash2 size={14} className="text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ═══ TESTIMONIALS TAB ═══ */}
            <TabsContent value="testimonials">
              {testimonials.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No testimonials submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {testimonials.map((t) => (
                    <div key={t.id} className="bg-card rounded-xl p-4 border border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">{t.name}</span>
                            {t.role && <span className="text-xs text-muted-foreground">• {t.role}</span>}
                            {t.business_name && <span className="text-xs text-muted-foreground">• {t.business_name}</span>}
                          </div>
                          <StarRating rating={t.rating || 5} readonly size={14} />
                          <p className="text-sm text-foreground/80 mt-2">{t.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => toggleTestimonialPublish(t.id, t.is_published)}
                            title={t.is_published ? "Unpublish" : "Publish"}
                          >
                            {t.is_published ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteTestimonial(t.id)}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ═══ CONTACTS TAB ═══ */}
            <TabsContent value="contacts">
              {contacts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No contact messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="bg-card rounded-xl p-4 border border-border/50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-semibold text-foreground text-sm">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{c.email}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {c.business_name && <p className="text-xs text-muted-foreground mb-1">Business: {c.business_name}</p>}
                      <p className="text-sm text-foreground/80">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
