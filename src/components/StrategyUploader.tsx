
import React, { useRef, useState } from "react";
import { useBackendIntegration } from "../hooks/useBackendIntegration";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const defaultParams = {
  param_a: "10",
  param_b: "20"
};

const StrategyUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [params, setParams] = useState(defaultParams);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { isUploading, backendResponse, uploadZipAndParams, setBackendResponse } = useBackendIntegration();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams((old) => ({ ...old, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Faça o upload do arquivo ZIP de dados históricos");
      return;
    }

    try {
      const resp = await uploadZipAndParams(selectedFile, params);
      toast.success("Arquivo enviado e processamento iniciado!");
    } catch (err) {
      toast.error("Erro ao enviar arquivo ou parâmetros");
    }
  };

  return (
    <Card className="p-6 space-y-4 max-w-xl mx-auto mt-10 bg-gray-900 border-gray-800">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="file" className="block mb-2 text-gray-300">Arquivo de Dados (ZIP)</Label>
          <Input
            id="file"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="bg-gray-800 border-gray-700 text-white"
            ref={fileInputRef}
          />
        </div>
        <div>
          <Label htmlFor="param_a" className="block text-gray-400 mb-1">Parâmetro A</Label>
          <Input
            id="param_a"
            name="param_a"
            value={params.param_a}
            onChange={handleParamChange}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <Label htmlFor="param_b" className="block text-gray-400 mb-1">Parâmetro B</Label>
          <Input
            id="param_b"
            name="param_b"
            value={params.param_b}
            onChange={handleParamChange}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? "Enviando..." : "Enviar para Backtest"}
        </Button>
      </form>
      {/* Exibe resposta/backtest/resultados do FastAPI */}
      {backendResponse && (
        <Card className={`p-4 mt-4 ${backendResponse.status === "error" ? "bg-red-950" : "bg-green-950"}`}>
          <div className="text-gray-200">
            <div className="font-bold mb-1">
              {backendResponse.status === "error" ? "Erro:" : "🏁 Processamento Concluído"}
            </div>
            <pre className="overflow-x-auto text-xs text-gray-400">
              {backendResponse.message ?? JSON.stringify(backendResponse.data, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </Card>
  );
};

export default StrategyUploader;
