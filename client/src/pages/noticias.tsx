import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Newspaper, RefreshCw, Clock, User, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/logo";
import BottomNav from "@/components/bottom-nav";
import { useLocation } from "wouter";
import useActivityTracker from "@/hooks/useActivityTracker";

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  author: number;
  featured_media: number;
  link: string;
  slug: string;
  _embedded?: {
    author?: Array<{
      name: string;
      description: string;
      avatar_urls: Record<string, string>;
    }>;
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
      media_details: {
        sizes: Record<string, { source_url: string; width: number; height: number; }>;
      };
    }>;
  };
}

interface WordPressAuthor {
  id: number;
  name: string;
  description: string;
  avatar_urls: Record<string, string>;
}

export default function Noticias() {
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<WordPressPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sistema de rastreamento de atividade
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const activityTracker = useActivityTracker({
    userId,
    enableViewTracking: true,
    enableDurationTracking: true,
    minDurationMs: 3000, // Mínimo 3 segundos para considerar leitura
  });

  // Rastrear visualização quando uma notícia é selecionada
  useEffect(() => {
    if (selectedPost) {
      activityTracker.startViewSession(
        'noticia',
        selectedPost.id.toString(),
        selectedPost.title.rendered,
        'conteudo',
        ['noticias', 'wordpress', 'leitura']
      );
    } else {
      activityTracker.endViewSession();
    }
  }, [selectedPost, activityTracker]);

  // Rastreamento inicial da página
  useEffect(() => {
    activityTracker.trackClick('page', 'noticias', 'Página de Notícias', 'navegacao', ['noticias', 'home']);
  }, [activityTracker]);

  const API_BASE = "https://institutoogrito.org/wp-json/wp/v2";

  const fetchPosts = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      setLoading(true);
      setError(false);

      const response = await fetch(
        `${API_BASE}/posts?per_page=10&page=${pageNum}&_embed=author,wp:featuredmedia&orderby=date&order=desc`
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar notícias");
      }

      const newPosts = await response.json();
      const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
      
      if (refresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error("Erro ao buscar posts:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, true);
  }, []);

  const handleRefresh = () => {
    setSelectedPost(null);
    setPage(1);
    fetchPosts(1, true);
    
    // Rastrear ação de refresh
    activityTracker.trackClick('page', 'noticias-refresh', 'Refresh Notícias', 'conteudo', ['noticias', 'refresh']);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false);
      
      // Rastrear carregamento de mais conteúdo
      activityTracker.trackClick('page', 'noticias-load-more', 'Carregar Mais Notícias', 'conteudo', ['noticias', 'paginacao']);
    }
  };

  const handleExternalLink = () => {
    window.open("https://institutoogrito.org/", "_blank");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-bold text-black">Notícias</h1>
              <p className="text-xs text-gray-600">Clube do Grito</p>
            </div>
          </div>

        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto">
        {/* Loading State */}
        {loading && posts.length === 0 && (
          <div className="px-4 py-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="px-4 py-8">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  Erro ao carregar notícias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Não foi possível carregar as notícias do Instituto O Grito. 
                  Verifique sua conexão com a internet e tente novamente.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleRefresh} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                  <Button variant="outline" onClick={handleExternalLink}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no navegador
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Post Detail View */}
        {selectedPost && (
          <div className="px-4 py-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setSelectedPost(null)}
              className="mb-4 p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às notícias
            </Button>

            <Card>
              {/* Featured Image */}
              {selectedPost._embedded?.["wp:featuredmedia"]?.[0] && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={selectedPost._embedded["wp:featuredmedia"][0].source_url}
                    alt={selectedPost._embedded["wp:featuredmedia"][0].alt_text || selectedPost.title.rendered}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <CardContent className="p-4">
                {/* Title */}
                <h1 className="text-xl font-bold text-gray-900 mb-3">
                  {stripHtml(selectedPost.title.rendered)}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedPost.date)}
                  </div>
                  {selectedPost._embedded?.author?.[0] && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {selectedPost._embedded.author[0].name}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content.rendered }}
                />


              </CardContent>
            </Card>
          </div>
        )}

        {/* Posts List */}
        {!selectedPost && !error && posts.length > 0 && (
          <div className="px-4 py-4 space-y-4">
            {posts.map((post) => (
              <Card 
                key={post.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedPost(post);
                  
                  // Rastrear clique na notícia
                  activityTracker.trackClick(
                    'noticia',
                    post.id.toString(),
                    post.title.rendered,
                    'conteudo',
                    ['noticias', 'wordpress']
                  );
                }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Featured Image */}
                    {post._embedded?.["wp:featuredmedia"]?.[0] && (
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded">
                        <img
                          src={post._embedded["wp:featuredmedia"][0].media_details?.sizes?.thumbnail?.source_url || post._embedded["wp:featuredmedia"][0].source_url}
                          alt={post._embedded["wp:featuredmedia"][0].alt_text || post.title.rendered}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {stripHtml(post.title.rendered)}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {truncateText(stripHtml(post.excerpt.rendered), 120)}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.date)}
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Carregar mais notícias
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="px-4 py-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Newspaper className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma notícia encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Não há notícias disponíveis no momento.
                </p>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}