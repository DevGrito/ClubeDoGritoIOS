import { Storage } from '@google-cloud/storage';
import * as path from 'node:path';
import * as fs from 'node:fs';



// Configurar Google Cloud Storage
const credentialsPath = path.join(process.cwd(), 'gcs-service-account.json');

// Verificar se o arquivo existe
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Arquivo de credenciais GCS não encontrado:', credentialsPath);
  throw new Error('GCS credentials file not found');
}

// Inicializar cliente do GCS
const storage = new Storage({
  keyFilename: credentialsPath,
  projectId: 'infra-optics-454414-g5'
});

// Nome do bucket
const BUCKET_NAME = 'clubedogrito';
const bucket = storage.bucket(BUCKET_NAME);
const UPLOAD_PREFIX = 'uploads/beneficios';

console.log('✅ GCS Service inicializado com bucket:', BUCKET_NAME);

/**
 * Faz upload de um arquivo para o GCS
 * @param fileBuffer - Buffer do arquivo
 * @param fileName - Nome do arquivo no GCS
 * @param mimeType - Tipo MIME do arquivo
 * @returns URL pública do arquivo
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    // ✅ caminho correto no bucket (sem "public/")
    const destination = `${UPLOAD_PREFIX}/${fileName}`;
    const file = bucket.file(destination);

    console.log('📤 [GCS] Fazendo upload:', destination);

    // ✅ UBLA: sem ACL pública
    await file.save(fileBuffer, {
      resumable: false,
      metadata: {
        contentType: mimeType,
      },
    });

    // Retornar URL pública
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;
    console.log('✅ [GCS] Upload concluído:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ [GCS] Erro no upload:', error);
    throw error;
  }
}

/**
 * Gera uma URL assinada para acessar arquivo privado
 * @param filePath - Caminho do arquivo no bucket (ex: public/uploads/beneficios/xxx.png)
 * @param expiresInMinutes - Tempo de expiração em minutos (padrão: 60)
 * @returns URL assinada
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  try {
    // Remover prefixo da URL completa se houver
    const cleanPath = filePath
      .replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '')
      .replace(/^\//, '');

    const file = bucket.file(cleanPath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return url;
  } catch (error) {
    console.error('❌ [GCS] Erro ao gerar signed URL:', error);
    throw error;
  }
}

/**
 * Verifica se um arquivo existe no bucket
 * @param filePath - Caminho do arquivo no bucket
 * @returns true se existe, false caso contrário
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const cleanPath = filePath
      .replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '')
      .replace(/^\//, '');

    const file = bucket.file(cleanPath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('❌ [GCS] Erro ao verificar arquivo:', error);
    return false;
  }
}

/**
 * Extrai o caminho do arquivo de uma URL completa do GCS
 * @param url - URL completa do GCS
 * @returns Caminho do arquivo
 */
export function extractFilePathFromUrl(url: string): string {
  return url
    .replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '')
    .replace(/^\//, '');
}

/**
 * Faz upload de múltiplas imagens base64 para o GCS
 * @param base64Images - Array de strings base64 (com ou sem prefixo data:image)
 * @param prefix - Prefixo para o nome dos arquivos (ex: 'missoes/evidencias')
 * @returns Array de URLs públicas
 */
export async function uploadBase64ImagesToGCS(
  base64Images: string[],
  prefix: string = 'missoes/evidencias'
): Promise<string[]> {
  const uploadPromises = base64Images.map(async (base64Image, index) => {
    try {
      // Remover prefixo data:image/xxx;base64, se houver
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

      // Converter base64 para Buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Detectar tipo MIME (assumir PNG se não especificado)
      let mimeType = 'image/png';
      const match = base64Image.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const extension = mimeType.split('/')[1] || 'png';
      const fileName = `${prefix}-${timestamp}-${index}-${randomSuffix}.${extension}`;

      // Fazer upload
      const destination = `uploads/${prefix}/${fileName}`;
      const file = bucket.file(destination);

      console.log(`📤 [GCS] Fazendo upload de evidência ${index + 1}:`, destination);

      await file.save(imageBuffer, {
        metadata: {
          contentType: mimeType,
        },
        public: true,
      });

      // Tornar o arquivo explicitamente público
      await file.makePublic();
      console.log(`🔓 [GCS] Permissões públicas aplicadas para evidência ${index + 1}`);

      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;
      console.log(`✅ [GCS] Upload ${index + 1} concluído:`, publicUrl);

      return publicUrl;
    } catch (error) {
      console.error(`❌ [GCS] Erro no upload da imagem ${index + 1}:`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
}

export async function deleteObject(objectPath: string): Promise<void> {
  try {
    const cleanPath = objectPath.replace(/^https?:\/\/storage\.googleapis\.com\/[^/]+\//, '').replace(/^\//, '');
    await bucket.file(cleanPath).delete({ ignoreNotFound: true });
    console.log('🗑️ [GCS] Objeto removido:', cleanPath);
  } catch (err) {
    // não falhe a operação só por causa do GCS; loga e segue
    console.warn('⚠️ [GCS] Falha ao remover objeto:', objectPath, err);
  }
}

export { storage, bucket, BUCKET_NAME };
