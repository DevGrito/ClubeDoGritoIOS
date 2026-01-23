import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Upload, Image, Trash2, Download, Calendar, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryProps {
  instanceId: number;
}

interface Photo {
  id: number;
  instance_id: number;
  session_id?: number;
  filename: string;
  original_filename: string;
  file_size: number;
  upload_date: string;
  description?: string;
  session_date?: string;
  session_title?: string;
}

export function PhotoGallery({ instanceId }: PhotoGalleryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none');
  const [filter, setFilter] = useState({
    session: 'all',
    month: ''
  });

  // Fetch photos for the instance
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['/api/pec/photos', instanceId, filter],
    queryFn: () => {
      const params = new URLSearchParams({ instance_id: instanceId.toString() });
      if (filter.session && filter.session !== 'all') params.append('session_id', filter.session);
      if (filter.month) params.append('month', filter.month);
      return apiRequest(`/api/pec/photos?${params}`);
    }
  }) as { data: Photo[], isLoading: boolean };

  // Fetch sessions for dropdown
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/instances', instanceId, 'sessions'],
    queryFn: () => apiRequest(`/api/instances/${instanceId}/sessions`)
  }) as { data: any[] };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/pec/photos/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/photos'] });
      toast({ title: "Fotos enviadas com sucesso!" });
      setUploadOpen(false);
      setSelectedFiles([]);
      setUploadDescription('');
      setSelectedSessionId('none');
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar fotos", description: error.message, variant: "destructive" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (photoId: number) => apiRequest(`/api/pec/photos/${photoId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/photos'] });
      toast({ title: "Foto excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir foto", variant: "destructive" });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      // Validar cada arquivo
      files.forEach(file => {
        // Validar tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          errors.push(`${file.name}: Tipo não suportado. Use apenas JPG, JPEG ou PNG.`);
          return;
        }
        
        // Validar tamanho (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB em bytes
        if (file.size > maxSize) {
          errors.push(`${file.name}: Arquivo muito grande. Máximo permitido: 10MB.`);
          return;
        }
        
        validFiles.push(file);
      });
      
      // Mostrar erros se houver
      if (errors.length > 0) {
        toast({
          title: "Arquivos inválidos encontrados:",
          description: errors.slice(0, 3).join('\n'), // Mostrar até 3 erros
          variant: "destructive"
        });
      }
      
      // Só usar os arquivos válidos
      setSelectedFiles(validFiles);
      
      // Notificar sobre arquivos válidos processados
      if (validFiles.length > 0 && errors.length > 0) {
        toast({
          title: `${validFiles.length} foto${validFiles.length > 1 ? 's' : ''} selecionada${validFiles.length > 1 ? 's' : ''}`,
          description: `${errors.length} arquivo${errors.length > 1 ? 's foram' : ' foi'} ignorado${errors.length > 1 ? 's' : ''} por não atender aos critérios.`
        });
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "Selecione ao menos uma foto", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('instance_id', instanceId.toString());
    if (selectedSessionId && selectedSessionId !== 'none') formData.append('session_id', selectedSessionId);
    if (uploadDescription) formData.append('description', uploadDescription);
    
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    uploadMutation.mutate(formData);
  };

  const handleDelete = (photo: Photo) => {
    if (confirm('Tem certeza que deseja excluir esta foto?')) {
      deleteMutation.mutate(photo.id);
    }
  };

  const getPhotoUrl = (filename: string) => `/api/pec/photos/file/${filename}`;
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Group photos by session or date
  const groupedPhotos = photos.reduce((acc: any, photo) => {
    const key = photo.session_title || format(new Date(photo.upload_date), 'dd/MM/yyyy', { locale: pt });
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header with filters and upload */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex flex-wrap gap-4">
          <div className="min-w-[200px]">
            <Label>Filtrar por Sessão</Label>
            <Select value={filter.session} onValueChange={(value) => setFilter(prev => ({ ...prev, session: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as sessões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as sessões</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: pt })} - {session.content_summary?.slice(0, 30)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="min-w-[150px]">
            <Label>Filtrar por Mês</Label>
            <Input 
              type="month" 
              value={filter.month}
              onChange={(e) => setFilter(prev => ({ ...prev, month: e.target.value }))}
            />
          </div>
        </div>
        
        <Button onClick={() => setUploadOpen(true)} data-testid="btn-upload-photos">
          <Upload className="h-4 w-4 mr-2" />
          Enviar Fotos
        </Button>
      </div>

      {/* Photo Gallery */}
      {isLoading ? (
        <div className="text-center py-8">Carregando fotos...</div>
      ) : Object.keys(groupedPhotos).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma foto encontrada</h3>
            <p className="text-gray-600 mb-4">Comece enviando as primeiras fotos das atividades</p>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Primeira Foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([groupName, groupPhotos]: [string, any]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {groupName}
                  <Badge variant="outline">{(groupPhotos as Photo[]).length} foto{(groupPhotos as Photo[]).length > 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(groupPhotos as Photo[]).map((photo) => (
                    <div 
                      key={photo.id} 
                      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedPhoto(photo)}
                      data-testid={`photo-${photo.id}`}
                    >
                      <img 
                        src={getPhotoUrl(photo.filename)}
                        alt={photo.description || 'Foto da atividade'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getPhotoUrl(photo.filename), '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-300 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(photo);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* File info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{photo.original_filename}</p>
                        <p>{formatFileSize(photo.file_size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Fotos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Sessão (opcional)</Label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sessão ou deixe em branco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem sessão específica</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: pt })} - {session.content_summary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Input 
                placeholder="Descreva as fotos ou atividade"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Selecionar Fotos</Label>
              <Input 
                type="file" 
                multiple 
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-600 mt-1">
                Selecione uma ou mais fotos (JPG, JPEG, PNG) - máximo 10MB cada
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Fotos Selecionadas ({selectedFiles.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUploadOpen(false)} data-testid="btn-cancel-upload">
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                data-testid="btn-confirm-upload"
              >
                {uploadMutation.isPending ? 'Enviando...' : `Enviar ${selectedFiles.length} foto${selectedFiles.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo View Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.description || 'Foto da Atividade'}</DialogTitle>
          </DialogHeader>
          
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={getPhotoUrl(selectedPhoto.filename)}
                  alt={selectedPhoto.description || 'Foto da atividade'}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nome do arquivo:</strong> {selectedPhoto.original_filename}
                </div>
                <div>
                  <strong>Tamanho:</strong> {formatFileSize(selectedPhoto.file_size)}
                </div>
                <div>
                  <strong>Data de envio:</strong> {format(new Date(selectedPhoto.upload_date), 'dd/MM/yyyy HH:mm', { locale: pt })}
                </div>
                {selectedPhoto.session_title && (
                  <div>
                    <strong>Sessão:</strong> {selectedPhoto.session_title}
                  </div>
                )}
                {selectedPhoto.description && (
                  <div className="md:col-span-2">
                    <strong>Descrição:</strong> {selectedPhoto.description}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(getPhotoUrl(selectedPhoto.filename), '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(selectedPhoto);
                    setSelectedPhoto(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}