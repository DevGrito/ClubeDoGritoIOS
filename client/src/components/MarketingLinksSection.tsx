import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus,
  Link as LinkIcon,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  MousePointerClick,
  Zap,
  RefreshCw,
  Users,
  TrendingUp,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface LinkWithOwner {
  id: number;
  campaignId: number | null;
  code: string;
  medium: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  maxConversions: number | null;
  expiresAt: string | null;
  rewardToUserId: number | null;
  isActive: boolean;
  createdAt: string;
  ownerName: string;
  ownerPhone: string | null;
  stats: {
    clicks: number;
    cadastros: number;
    conversoes: number;
    taxa: number;
  };
}

interface ActiveCampaignData {
  campaign: Campaign | null;
  links: LinkWithOwner[];
}

export function MarketingLinksSection({ queryClient: _queryClient }: { queryClient: any }) {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Campaign form
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  
  // Link form
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [linkCode, setLinkCode] = useState("");
  const [linkExpiresAt, setLinkExpiresAt] = useState("");
  const [linkIsActive, setLinkIsActive] = useState(true);
  
  // Geração de link personalizado
  const [participanteNome, setParticipanteNome] = useState("");
  const [participanteSobrenome, setParticipanteSobrenome] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  const { data: activeCampaignData, isLoading: loadingActive, refetch: refetchActive } = useQuery<ActiveCampaignData>({
    queryKey: ["/api/mkt/active-campaign"],
  });

  const { data: allCampaigns, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/mkt/campaigns"],
  });

  const handleGenerateSlug = async () => {
    if (!participanteNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Preencha o nome do participante para gerar o link",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSlug(true);
    try {
      const data = await apiRequest("/api/mkt/generate-slug", {
        method: "POST",
        body: JSON.stringify({
          nome: participanteNome,
          sobrenome: participanteSobrenome || "",
        }),
      });

      setLinkCode(data.slug);
      toast({
        title: "Link gerado!",
        description: `Link: https://clubedogrito.institutogrito.com.br/plans?ref=${data.slug}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await apiRequest("/api/mkt/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: campaignName,
          description: campaignDescription || null,
          isActive: true,
        }),
      });
      
      toast({
        title: "Campanha criada!",
        description: `A campanha "${campaignName}" foi criada com sucesso.`,
      });
      
      setCampaignName("");
      setCampaignDescription("");
      setShowCampaignDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/mkt/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mkt/active-campaign"] });
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateLink = async () => {
    try {
      const payload: any = {
        campaignId: activeCampaignData?.campaign ? activeCampaignData.campaign.id : null,
        code: linkCode,
        targetUrl: `/plans?ref=${linkCode}`,
        medium: 'custom',
        source: 'manual',
        utmCampaign: activeCampaignData?.campaign?.name || 'manual',
        utmMedium: 'referral',
        utmSource: 'custom-link',
        isActive: linkIsActive,
        expiresAt: null,
      };
      
      if (linkExpiresAt && linkExpiresAt.trim()) {
        const date = new Date(linkExpiresAt);
        if (!isNaN(date.getTime())) {
          payload.expiresAt = date.toISOString();
        }
      }
      
      await apiRequest("/api/mkt/links", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      toast({
        title: "Link criado!",
        description: `Link https://clubedogrito.institutogrito.com.br/plans?ref=${linkCode} criado com sucesso.`,
      });
      
      setLinkCode("");
      setSelectedCampaign("");
      setLinkExpiresAt("");
      setParticipanteNome("");
      setParticipanteSobrenome("");
      setShowLinkDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/mkt/active-campaign"] });
    } catch (error: any) {
      toast({
        title: "Erro ao criar link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `https://clubedogrito.institutoogrito.com.br/plans?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleLinkStatus = async (linkId: number, currentStatus: boolean) => {
    try {
      await apiRequest(`/api/mkt/links/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });
      
      toast({
        title: currentStatus ? "Link desativado" : "Link ativado",
        description: "Status do link atualizado com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/mkt/active-campaign"] });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Calcular métricas consolidadas
  const links = activeCampaignData?.links || [];
  const totalLinks = links.length;
  const linksAtivos = links.filter(l => l.isActive).length;
  const totalClicks = links.reduce((sum, l) => sum + l.stats.clicks, 0);
  const totalCadastros = links.reduce((sum, l) => sum + l.stats.cadastros, 0);
  const totalConversoes = links.reduce((sum, l) => sum + l.stats.conversoes, 0);
  const taxaMedia = totalCadastros > 0 ? (totalConversoes / totalCadastros) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LinkIcon className="w-7 h-7 text-indigo-600" />
            Sistema de Marketing - Indique e Ganhe
          </h2>
          <p className="text-gray-600">
            {activeCampaignData?.campaign 
              ? `Campanha ativa: ${activeCampaignData.campaign.name}`
              : 'Nenhuma campanha ativa'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchActive();
              refetchCampaigns();
            }}
            className="flex items-center gap-2"
            data-testid="button-refresh-marketing"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Dashboard Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total de Links</p>
                <p className="text-3xl font-bold text-blue-900">{totalLinks}</p>
              </div>
              <LinkIcon className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Links Ativos</p>
                <p className="text-3xl font-bold text-green-900">{linksAtivos}</p>
              </div>
              <Eye className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Cliques</p>
                <p className="text-3xl font-bold text-orange-900">{totalClicks.toLocaleString("pt-BR")}</p>
              </div>
              <MousePointerClick className="w-10 h-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Cadastros</p>
                <p className="text-3xl font-bold text-purple-900">{totalCadastros.toLocaleString("pt-BR")}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-700 font-medium">Conversões</p>
                <p className="text-3xl font-bold text-cyan-900">{totalConversoes.toLocaleString("pt-BR")}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-cyan-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-700 font-medium">Taxa</p>
                <p className="text-3xl font-bold text-pink-900">{taxaMedia.toFixed(1)}%</p>
              </div>
              <Zap className="w-10 h-10 text-pink-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Campanhas
          </h3>
          <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-campaign">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Campanha</DialogTitle>
                <DialogDescription>
                  Crie uma nova campanha de marketing para agrupar links relacionados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Ex: IV ENCONTRO DO GRITO"
                    data-testid="input-campaign-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-description">Descrição (opcional)</Label>
                  <Textarea
                    id="campaign-description"
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Descreva o objetivo desta campanha..."
                    data-testid="input-campaign-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={!campaignName.trim()}
                  data-testid="button-submit-campaign"
                >
                  Criar Campanha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loadingCampaigns ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : allCampaigns && allCampaigns.length > 0 ? (
          <div className="grid gap-3">
            {allCampaigns.map((campaign) => (
              <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`} className={campaign.isActive ? "border-green-500 bg-green-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <Badge variant={campaign.isActive ? "default" : "secondary"} className={campaign.isActive ? "bg-green-600" : ""}>
                          {campaign.isActive ? "✅ Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Criada em {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma campanha criada ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Links */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-500" />
            Links de Marketing da Campanha Ativa
          </h3>
          <div className="flex gap-2">
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-link">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Link Personalizado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Link de Marketing Personalizado</DialogTitle>
                  <DialogDescription>
                    Crie um link rastreável vinculado à campanha ativa.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="link-campaign">Campanha</Label>
                    <Select 
                      value={activeCampaignData?.campaign ? activeCampaignData.campaign.id.toString() : ""} 
                      onValueChange={setSelectedCampaign}
                      disabled
                    >
                      <SelectTrigger id="link-campaign" data-testid="select-campaign">
                        <SelectValue placeholder={activeCampaignData?.campaign?.name || "Nenhuma campanha ativa"} />
                      </SelectTrigger>
                      <SelectContent>
                        {activeCampaignData?.campaign && (
                          <SelectItem value={activeCampaignData.campaign.id.toString()}>
                            {activeCampaignData.campaign.name}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg space-y-3 border-2 border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">Gerar Link Personalizado</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="participante-nome">Nome *</Label>
                        <Input
                          id="participante-nome"
                          value={participanteNome}
                          onChange={(e) => setParticipanteNome(e.target.value)}
                          placeholder="João"
                          data-testid="input-participante-nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="participante-sobrenome">Sobrenome</Label>
                        <Input
                          id="participante-sobrenome"
                          value={participanteSobrenome}
                          onChange={(e) => setParticipanteSobrenome(e.target.value)}
                          placeholder="Silva"
                          data-testid="input-participante-sobrenome"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSlug}
                      disabled={isGeneratingSlug || !participanteNome.trim()}
                      className="w-full"
                      data-testid="button-generate-slug"
                    >
                      {isGeneratingSlug ? "Gerando..." : "Gerar Link Personalizado"}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="link-code">Código do Link (gerado automaticamente)</Label>
                    <Input
                      id="link-code"
                      value={linkCode}
                      onChange={(e) => setLinkCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="joao-silva"
                      data-testid="input-link-code"
                      disabled
                    />
                    <p className="text-xs text-gray-500">
                      Link final: https://clubedogrito.institutogrito.com.br/plans?ref={linkCode || 'seu-link'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link-expires-at">Data de Expiração</Label>
                    <Input
                      id="link-expires-at"
                      type="date"
                      value={linkExpiresAt}
                      onChange={(e) => setLinkExpiresAt(e.target.value)}
                      data-testid="input-link-expires-at"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="link-active"
                      checked={linkIsActive}
                      onCheckedChange={setLinkIsActive}
                      data-testid="switch-link-active"
                    />
                    <Label htmlFor="link-active">Link ativo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateLink}
                    disabled={!linkCode.trim() || !activeCampaignData?.campaign}
                    data-testid="button-submit-link"
                  >
                    Criar Link
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loadingActive ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : links && links.length > 0 ? (
          <div className="grid gap-3">
            {links.map((link) => (
              <LinkCardWithOwner
                key={link.id}
                link={link}
                copiedCode={copiedCode}
                onCopy={copyToClipboard}
                onToggle={toggleLinkStatus}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <LinkIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {activeCampaignData?.campaign 
                  ? "Nenhum link criado ainda para esta campanha."
                  : "Crie uma campanha primeiro para adicionar links."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function LinkCardWithOwner({ 
  link, 
  copiedCode, 
  onCopy, 
  onToggle
}: {
  link: LinkWithOwner;
  copiedCode: string | null;
  onCopy: (code: string) => void;
  onToggle: (id: number, currentStatus: boolean) => void;
}) {
  const fullUrl = `https://clubedogrito.institutoogrito.com.br/plans?ref=${link.code}`;
  
  return (
    <Card data-testid={`link-card-${link.id}`} className={!link.isActive ? "opacity-60 bg-gray-50" : "border-blue-200"}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com código e status */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  {link.code}
                </code>
                <Badge variant={link.isActive ? "default" : "secondary"} className={link.isActive ? "bg-green-600" : ""}>
                  {link.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">{link.ownerName}</span>
                {link.ownerPhone && (
                  <span className="text-xs text-gray-400">({link.ownerPhone})</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{fullUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(link.code)}
                data-testid={`button-copy-${link.code}`}
              >
                {copiedCode === link.code ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(link.id, link.isActive)}
                data-testid={`button-toggle-${link.code}`}
              >
                {link.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            <div className="text-center bg-orange-50 p-2 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 font-medium mb-1">Cliques</p>
              <p className="text-2xl font-bold text-orange-900">{link.stats.clicks}</p>
            </div>
            <div className="text-center bg-purple-50 p-2 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700 font-medium mb-1">Cadastros</p>
              <p className="text-2xl font-bold text-purple-900">{link.stats.cadastros}</p>
            </div>
            <div className="text-center bg-cyan-50 p-2 rounded-lg border border-cyan-200">
              <p className="text-xs text-cyan-700 font-medium mb-1">Conversões</p>
              <p className="text-2xl font-bold text-cyan-900">{link.stats.conversoes}</p>
            </div>
            <div className="text-center bg-pink-50 p-2 rounded-lg border border-pink-200">
              <p className="text-xs text-pink-700 font-medium mb-1">Taxa</p>
              <p className="text-2xl font-bold text-pink-900">{link.stats.taxa.toFixed(1)}%</p>
            </div>
          </div>

          {/* Metadados */}
          {(link.maxConversions || link.expiresAt) && (
            <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              {link.maxConversions && (
                <span>Max: {link.maxConversions} conversões</span>
              )}
              {link.expiresAt && (
                <span>Expira: {new Date(link.expiresAt).toLocaleDateString("pt-BR")}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
