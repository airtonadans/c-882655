
import { useState } from 'react';

type BackendResponse = {
  status: 'success' | 'error';
  data?: any;
  message?: string;
};

export function useBackendIntegration() {
  const [isUploading, setIsUploading] = useState(false);
  const [backendResponse, setBackendResponse] = useState<BackendResponse | null>(null);

  // Faz upload do arquivo ZIP junto com parâmetros via POST multipart/form para FastAPI
  async function uploadZipAndParams(file: File, params: Record<string, any>) {
    setIsUploading(true);
    setBackendResponse(null);

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(params).forEach(([key, val]) => formData.append(key, String(val)));

    try {
      // Ajuste para o endpoint real do seu backend FastAPI
      const resp = await fetch('http://localhost:8000/upload-backtest', {
        method: 'POST',
        body: formData,
      });

      const result = await resp.json();
      setBackendResponse({ status: result.status || 'success', data: result.data, message: result.message });
      setIsUploading(false);
      return result;
    } catch (error: any) {
      setBackendResponse({ status: 'error', message: error?.message || 'Erro desconhecido' });
      setIsUploading(false);
      throw error;
    }
  }

  return { isUploading, backendResponse, uploadZipAndParams, setBackendResponse };
}
